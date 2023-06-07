wget https://dist.ipfs.tech/kubo/v0.20.0/kubo_v0.20.0_linux-amd64.tar.gz
tar -xvf kubo_v0.20.0_linux-amd64.tar.gz
chmod +x ./kubo/install.sh
./kubo/install.sh
exit

ipfs --version
ipfs init
ipfs bootstrap rm --all
ipfs bootstrap add /ip4/10.184.0.7/tcp/4001/ipfs/12D3KooWLM9A3HNnCxXHJCknnjBE3iaqyhtS6iLRH4fFgVMVBxzG

LIBP2P_FORCE_PNET=1 ipfs daemon

scp swarm.key halcyon@34.101.231.188:~/.ipfs/
scp swarm.key halcyon@34.101.87.56:~/.ipfs/

scp -r testcases halcyon@34.101.87.56:~

QmZLws5v55MQJmyTo2deZfp3Z1KuKa9MwyCaymTxqXXmkh