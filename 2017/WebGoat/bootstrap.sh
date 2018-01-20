echo "Updating package."
apt-get update

sudo apt-get install -y git wget curl

echo "Installing docker and docker-compose"
apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce
curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Installing Suricata"
add-apt-repository ppa:oisf/suricata-stable
apt-get update
apt-get install -y suricata
ldconfig
cp /vagrant/suricata.yaml /etc/suricata
service suricata stop
suricata -D -c /etc/suricata/suricata.yaml -i eth1 --init-errors-fatal

echo "Installing nkf"
apt-get install -f nkf

apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

echo "Checking versions"
python --version
docker --version
docker-compose --version
echo "nodejs: `node -v`"
echo "npm: `npm -v`"
echo "node: `node -v`"
suricata -V
