import sys
import json
import time
from pysnmp.hlapi import *

def format_uptime(centiseconds):
    if centiseconds is None:
        return 0
    seconds = centiseconds // 100
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    return f"{days}d {hours}h {minutes}m {seconds}s"

def SNMPGetWalkTemp(host, user, auth_key, priv_key, oid, port, auth_protocol=usmHMACSHAAuthProtocol, priv_protocol=usmAesCfb128Protocol):
    results = {}
    iterator = nextCmd(
        SnmpEngine(),
        UsmUserData(user, auth_key, priv_key, auth_protocol, priv_protocol),
        UdpTransportTarget((host, port)),
        ContextData(),
        ObjectType(ObjectIdentity(oid)),
        lexicographicMode=False  # Stop saat selesai
    )

    for errorIndication, errorStatus, errorIndex, varBinds in iterator:
        if errorIndication:
            print(f"Error: {errorIndication}")
            break
        elif errorStatus:
            print(f"Error: {errorStatus.prettyPrint()} at {errorIndex and varBinds[int(errorIndex) - 1][0] or '?'}")
            break
        else:
            for varBind in varBinds:
                oid_str, value = str(varBind[0]), varBind[1]
                results[oid_str] = str(value)  # Simpan hasil walk
    return results


def SNMPGetTemp(host, user, auth_key, priv_key, oid, port, auth_protocol=usmHMACSHAAuthProtocol, priv_protocol=usmAesCfb128Protocol):
    try:
        iterator = getCmd(
            SnmpEngine(),
            UsmUserData(user, auth_key, priv_key, auth_protocol, priv_protocol),
            UdpTransportTarget((host, port), timeout=2.0, retries=0),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )

        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

        if errorIndication:
            # print(f"Error: {errorIndication}", file=sys.stderr)
            return None
        elif errorStatus:
            # print(f"Error: {errorStatus.prettyPrint()} at {errorIndex and varBinds[int(errorIndex) - 1][0] or '?'}", file=sys.stderr)
            return None
        else:
            for varBind in varBinds:
                value = varBind[1]
                if isinstance(value, TimeTicks):
                    return int(value)
                elif isinstance(value, (Integer, Integer32, Counter32, Gauge32, Counter64, Unsigned32)):
                    return int(value)
                elif isinstance(value, (OctetString, IpAddress)):
                    return str(value)
                else:
                    return str(value)
    except Exception as e:
        # print(f"SNMP Error: {str(e)}", file=sys.stderr)
        return None
    
def SNMPGetDiskUsage(host, user, auth_key, priv_key, port):
    result = ''
    storage_names = SNMPGetWalkTemp(host, user, auth_key, priv_key, "1.3.6.1.2.1.25.2.3.1.3", port)

    root_index = None
    for oid, name in storage_names.items():
        if name == "/":  # Mencari yang namanya '/'
            root_index = oid.split(".")[-1]  # Ambil indeks
            break
    
    if root_index:
        disk_total_oid = f"1.3.6.1.2.1.25.2.3.1.5.{root_index}"
        disk_used_oid = f"1.3.6.1.2.1.25.2.3.1.6.{root_index}"
        disk_block_oid = f"1.3.6.1.2.1.25.2.3.1.4.{root_index}"

        disk_total = SNMPGetTemp(host, user, auth_key, priv_key, disk_total_oid, port)
        disk_used = SNMPGetTemp(host, user, auth_key, priv_key, disk_used_oid, port)
        disk_block = SNMPGetTemp(host, user, auth_key, priv_key, disk_block_oid, port)

        if disk_total and disk_used and disk_block:
            disk_total_bytes = int(disk_total) * int(disk_block)
            disk_used_bytes = int(disk_used) * int(disk_block)
            disk_usage_percent = (disk_used_bytes / disk_total_bytes) * 100

            result = f'{round(disk_usage_percent, 2)}%'

    return result


def SNMPGetInfo(attribute, max_retries=3):
    OIDS = {
        "status": "1.3.6.1.2.1.25.1.1.0",
        "uptime": "1.3.6.1.2.1.1.3.0",
        "cpu_usage": "1.3.6.1.4.1.2021.11.10.0", 
        "ram_total": "1.3.6.1.4.1.2021.4.5.0",
        "ram_available": "1.3.6.1.4.1.2021.4.6.0",
    }
    
    ipaddress = attribute['ipaddress']
    username = attribute['snmp_username']
    authkey = attribute['snmp_authkey']
    privkey = attribute['snmp_privkey']
    port = attribute['snmp_port']

    status = SNMPGetTemp(ipaddress, username, authkey, privkey, OIDS["status"], port)

    if status is None:
        return {
            'status': "DOWN",
            'uptime': "N/A",
            'cpu_usage': "N/A",
            'ram_usage': "N/A",
            'disk_usage': "N/A",
        }

    attempt = 0
    while attempt < max_retries:
        uptime = SNMPGetTemp(ipaddress, username, authkey, privkey, OIDS["uptime"], port)
        cpu_usage = SNMPGetTemp(ipaddress, username, authkey, privkey, OIDS["cpu_usage"], port)
        ram_total = SNMPGetTemp(ipaddress, username, authkey, privkey, OIDS["ram_total"], port)
        ram_available = SNMPGetTemp(ipaddress, username, authkey, privkey, OIDS["ram_available"], port)
        disk_usage = SNMPGetDiskUsage(ipaddress, username, authkey, privkey, port)

        if uptime and cpu_usage and ram_total and ram_available and disk_usage:
            break 

        attempt += 1

    uptime = format_uptime(uptime) if uptime else "N/A"
    cpu_usage = f'{round(cpu_usage / 100, 2)}%' if cpu_usage is not None else "N/A"
    disk_usage = disk_usage if disk_usage else "N/A"

    if ram_total and ram_available:
        ram_usage = f'{round((((ram_total - ram_available) / ram_total) * 100), 2)}%'
    else:
        ram_usage = "N/A"

    result = {
        'status': "UP",
        'uptime': uptime,
        'cpu_usage': cpu_usage,
        'ram_usage': ram_usage,
        'disk_usage': disk_usage,
    }

    return result


if __name__ == "__main__":
    data = sys.stdin.read()
    parsed_data = json.loads(data)
    result = SNMPGetInfo(parsed_data)

    print(json.dumps(result))
