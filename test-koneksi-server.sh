#!/bin/bash
# =============================================================
# Test Konektivitas Server TPS
# Jalankan di server 172.19.154.93 via AnyDesk
# Tanggal: 2026-03-06
# =============================================================

REPORT_FILE="/tmp/laporan-koneksi-$(date +%Y%m%d_%H%M%S).txt"
PASS=0
FAIL=0

header() {
  echo ""
  echo "============================================"
  echo " $1"
  echo "============================================"
}

test_result() {
  if [ $1 -eq 0 ]; then
    echo "  [PASS] $2"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $2"
    FAIL=$((FAIL + 1))
  fi
}

# Redirect semua output ke file + terminal
exec > >(tee -a "$REPORT_FILE") 2>&1

echo "============================================"
echo " LAPORAN PENGUJIAN KONEKTIVITAS SERVER TPS"
echo " Tanggal : $(date '+%Y-%m-%d %H:%M:%S')"
echo " Hostname: $(hostname)"
echo " IP      : $(hostname -I 2>/dev/null || echo 'N/A')"
echo " OS      : $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
echo "============================================"

# ---------------------------------------------------------
header "1. KONEKSI INTERNET"
# ---------------------------------------------------------

echo "  1a. DNS Resolution (google.com)..."
nslookup google.com > /dev/null 2>&1
test_result $? "DNS lookup google.com"

echo "  1b. Ping Google DNS (8.8.8.8)..."
ping -c 3 -W 3 8.8.8.8 > /dev/null 2>&1
test_result $? "Ping 8.8.8.8 (Google DNS)"

echo "  1c. Ping Cloudflare DNS (1.1.1.1)..."
ping -c 3 -W 3 1.1.1.1 > /dev/null 2>&1
test_result $? "Ping 1.1.1.1 (Cloudflare)"

echo "  1d. HTTP ke google.com..."
curl -s --connect-timeout 5 --max-time 10 https://www.google.com > /dev/null 2>&1
test_result $? "HTTP GET google.com"

echo "  1e. HTTP ke github.com..."
curl -s --connect-timeout 5 --max-time 10 https://github.com > /dev/null 2>&1
test_result $? "HTTP GET github.com"

echo "  1f. Apt/Package repo (archive.ubuntu.com)..."
curl -s --connect-timeout 5 --max-time 10 http://archive.ubuntu.com > /dev/null 2>&1
test_result $? "HTTP GET archive.ubuntu.com"

echo "  1g. Docker Hub (hub.docker.com)..."
curl -s --connect-timeout 5 --max-time 10 https://hub.docker.com > /dev/null 2>&1
test_result $? "HTTP GET hub.docker.com"

echo "  1h. NPM Registry (registry.npmjs.org)..."
curl -s --connect-timeout 5 --max-time 10 https://registry.npmjs.org > /dev/null 2>&1
test_result $? "HTTP GET registry.npmjs.org"

# ---------------------------------------------------------
header "2. KONEKSI INTERNAL (LAN)"
# ---------------------------------------------------------

echo "  2a. Ping DB Server (172.19.154.92)..."
ping -c 3 -W 3 172.19.154.92 > /dev/null 2>&1
test_result $? "Ping DB Server 172.19.154.92"

echo "  2b. Port PostgreSQL (172.19.154.92:5432)..."
timeout 5 bash -c 'echo > /dev/tcp/172.19.154.92/5432' 2>/dev/null
test_result $? "TCP connect 172.19.154.92:5432 (PostgreSQL)"

echo "  2c. PostgreSQL query test..."
PGPASSWORD=TpsDB2026Secure psql -h 172.19.154.92 -U postgres -d tps_web -c "SELECT 1" > /dev/null 2>&1
test_result $? "PostgreSQL SELECT 1"

echo "  2d. Ping gateway/router..."
GATEWAY=$(ip route | grep default | awk '{print $3}' | head -1)
if [ -n "$GATEWAY" ]; then
  ping -c 3 -W 3 "$GATEWAY" > /dev/null 2>&1
  test_result $? "Ping gateway $GATEWAY"
else
  echo "  [SKIP] Gateway tidak ditemukan"
fi

# ---------------------------------------------------------
header "3. DOCKER & CONTAINER"
# ---------------------------------------------------------

echo "  3a. Docker daemon..."
docker info > /dev/null 2>&1
test_result $? "Docker daemon running"

echo "  3b. Container tps-app status..."
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' tps-app 2>/dev/null)
if [ "$CONTAINER_STATUS" = "running" ]; then
  test_result 0 "Container tps-app running"
else
  test_result 1 "Container tps-app NOT running (status: $CONTAINER_STATUS)"
fi

echo "  3c. App port 3300 accessible..."
curl -s --connect-timeout 5 --max-time 10 http://localhost:3300/ > /dev/null 2>&1
test_result $? "HTTP GET localhost:3300"

echo "  3d. Container health (last 5 log lines)..."
echo "  --- Docker logs (tail 5) ---"
docker logs tps-app --tail 5 2>&1 | sed 's/^/  | /'
echo "  ---"

# ---------------------------------------------------------
header "4. LAYANAN TPS.CO.ID"
# ---------------------------------------------------------

echo "  4a. Homepage (localhost:3300/)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3300/)
if [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Homepage returns 200"
else
  test_result 1 "Homepage returns $HTTP_CODE (expected 200)"
fi

echo "  4b. Admin login page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3300/backend/tpsadmin)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
  test_result 0 "Admin page returns $HTTP_CODE"
else
  test_result 1 "Admin page returns $HTTP_CODE (expected 200/302)"
fi

echo "  4c. Static file serving (/_file/)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3300/_file/layout/header/header-default-bg.png)
if [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Static file returns 200"
else
  test_result 1 "Static file returns $HTTP_CODE"
fi

echo "  4d. WSDL Jadwal Kapal (tps.co.id:9090)..."
curl -s --connect-timeout 5 --max-time 10 http://www.tps.co.id:9090/WSCBS/Vessel?wsdl > /dev/null 2>&1
test_result $? "WSDL Vessel endpoint"

echo "  4e. Karir page (/karir)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3300/karir)
if [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Karir page returns 200"
else
  test_result 1 "Karir page returns $HTTP_CODE"
fi

# ---------------------------------------------------------
header "5. NETWORK CONFIGURATION"
# ---------------------------------------------------------

echo "  5a. Interface & IP:"
ip addr show | grep -E "inet " | grep -v 127.0.0.1 | sed 's/^/  | /'

echo ""
echo "  5b. Default route:"
ip route | grep default | sed 's/^/  | /'

echo ""
echo "  5c. DNS config (/etc/resolv.conf):"
cat /etc/resolv.conf 2>/dev/null | grep -v "^#" | grep -v "^$" | sed 's/^/  | /'

echo ""
echo "  5d. Firewall (iptables OUTPUT):"
iptables -L OUTPUT -n 2>/dev/null | head -10 | sed 's/^/  | /'

echo ""
echo "  5e. Proxy environment:"
echo "  | http_proxy  = ${http_proxy:-<not set>}"
echo "  | https_proxy = ${https_proxy:-<not set>}"
echo "  | no_proxy    = ${no_proxy:-<not set>}"

# ---------------------------------------------------------
header "6. DISK & RESOURCES"
# ---------------------------------------------------------

echo "  6a. Disk usage:"
df -h / /data/files 2>/dev/null | sed 's/^/  | /'

echo ""
echo "  6b. Memory:"
free -h | sed 's/^/  | /'

echo ""
echo "  6c. Docker volumes:"
du -sh /opt/tps-app/ 2>/dev/null | sed 's/^/  | /'
du -sh /opt/tps-data/ 2>/dev/null | sed 's/^/  | /'

# ---------------------------------------------------------
header "RINGKASAN"
# ---------------------------------------------------------

TOTAL=$((PASS + FAIL))
echo ""
echo "  Total pengujian : $TOTAL"
echo "  Berhasil (PASS) : $PASS"
echo "  Gagal    (FAIL) : $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  STATUS: SEMUA TEST LULUS"
else
  echo "  STATUS: ADA $FAIL TEST GAGAL - perlu investigasi"
fi

echo ""
echo "============================================"
echo " Laporan disimpan di: $REPORT_FILE"
echo "============================================"
