sudo su
wget https://dist.ipfs.tech/kubo/v0.20.0/kubo_v0.20.0_linux-amd64.tar.gz
tar -xvf kubo_v0.20.0_linux-amd64.tar.gz
chmod +x ./kubo/install.sh
./kubo/install.sh
exit
ipfs --version
ipfs init
