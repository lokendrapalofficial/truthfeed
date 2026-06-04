const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.article.findMany({
  select: { title: true, imageUrl: true, isLogo: true, isThematic: true },
  orderBy: { publishedAt: 'desc' },
  take: 15
}).then(rows => {
  rows.forEach(a => {
    const tag = a.isThematic ? '[THEMATIC]' : a.isLogo ? '[LOGO]' : '[IMAGE]';
    console.log(tag, (a.imageUrl || 'NULL').substring(0, 90));
    console.log('   title:', (a.title || '').substring(0, 60));
    console.log('');
  });
  p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });
