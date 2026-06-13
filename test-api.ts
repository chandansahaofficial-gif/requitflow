import { GET } from './app/api/companies-hiring/route';

async function test() {
  console.log('Testing GET /api/companies-hiring...');
  try {
    const req = new Request('http://localhost:3000/api/companies-hiring?page=1&pageSize=25');
    const res = await GET(req);
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (error) {
    console.error('Unhandled Exception:', error);
  }
}

test();
