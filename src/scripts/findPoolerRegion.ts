import net from 'net';

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'eu-north-1', 'ca-central-1', 'sa-east-1', 'me-central-1',
  'af-south-1'
];

function testConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function main() {
  console.log('Testing connection pooler regions on port 6543...');
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const ok = await testConnection(host, 6543);
    if (ok) {
      console.log(`Reachable: ${host} (port 6543 is OPEN)`);
    }
  }
  
  console.log('Testing connection pooler regions on port 5432...');
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const ok = await testConnection(host, 5432);
    if (ok) {
      console.log(`Reachable: ${host} (port 5432 is OPEN)`);
    }
  }
  console.log('Done.');
}

main();
