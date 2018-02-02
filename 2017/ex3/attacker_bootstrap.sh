echo "Updating package."
apt-get update

sudo apt-get install -y git wget curl

echo "Installing Python 2.7.9"
sudo apt-get install build-essential
sudo apt-get install libreadline-gplv2-dev libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev
mkdir -p ~/software
cd ~/software
wget https://www.python.org/ftp/python/2.7.9/Python-2.7.9.tgz
tar -xvf Python-2.7.9.tgz
cd Python-2.7.9
./configure
make
sudo make install

echo "Installing docker and docker-compose"
apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce
curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Installing node.js and npm"
apt-get install -y nodejs npm
npm -g install n
npm update npm -g
n stable

echo "Installing curl"
apt-get install -y curl

echo "Checking versions"
python --version
docker --version
docker-compose --version
echo "nodejs: `node -v`"
echo "npm: `npm -v`"
echo "node: `node -v`"

apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
