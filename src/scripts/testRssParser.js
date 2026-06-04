const { parseAlsoReportedPublishers } = require("../lib/rssParser");

const sampleHtml = `<ol><li><a href="https://news.google.com/rss/articles/CBMipwFBVV95cUxOeUJLY2FURzR0NU9tVGcxLWNIa0pIZEJYVXg2eFF0NlkyYzI2VU5BcWRoMXd1S19lWjdfck5lVVJPMmRSSU1xVURMYmFqUWR3SEh4MWxOV2JJc2NWZVhWVlJnUmpHeDJKVGF6ZkwtcXQxZm1FMEZ5dXZrX0YxZERmUlVQRWF0cGxlUV9GSDNxS1ZwVVVxdEpaX3FfSHo3b1BudWRwbGxTaw?oc=5" target="_blank">Trump confirms he called Netanyahu 'crazy,' as he says Israel is complicating peace talks with Iran</a>&nbsp;&nbsp;<font color="#6f6f6f">AP News</font></li><li><a href="https://news.google.com/rss/articles/CBMirAFBVV95cUxOOHdHdl9QVS1rZWNvMURzU0xvVlFoaC1kWEdhLWM1OVBJZU5ycUFvS2FfYlNObVMwcUZkYlBxcVZoaHE2Si1FbUYtVExIUDRUTm5jMWFLZTVwMWhwcVliUFVEY2tsNWdoOXFES3RwdDhDSlY4eGJCRU80NW4wclNIMWdGNGhJd05xNXkwcHRuQ3pPLXJ4dzNyV3E3WUJhcTJyaXFGR0oxbkx2aGh60gGyAUFVX3lxTE0zRFJiR0dTcU01NGZiQ3R0VDlkN0VYd2RlQlVVRVpQT29tMnJBcmJ6WUwxOFZvNlI5cVFWOGVUbVR1NkRqaHlITmlvTFgxWXNwenhLWkN6aG9HMUFlYUJ6XzJpa3BsdnJkSncyZU9zNVB1ZVJBZ095NHFLYXZsYndKdnNrUnJQT2ZPNkJvUnNyX1hoZGlKUU5xdHV5MmxZT3FhaDdKQmkzdkgwNUlRRnpKcUE?oc=5" target="_blank">Israel’s invasion of southern Lebanon devastates centuries of history</a>&nbsp;&nbsp;<font color="#6f6f6f">Al Jazeera</font></li><li><a href="https://news.google.com/rss/articles/CBMitAFBVV95cUxPN1dIT2RKU2Z4cFA1OUZ1WlloWFJmRVB5ajNzQkstZEVISUF6bEswTnY3Ml9tVWZuNnFySGdWWW1ibWllQWgzdUExWV9mZGNrYjg1RV9CZ0xzZ2NaQjRyMTNMTk5uZ2c5Uk5FY2kxRkFNX19VV0Z3ejRzU3dGSDY1a2F3VDU4dUhEZ0JqQ2x2YlczS3BuVi1NbzJXVjBXZ1M3YkF2cEJoNHZRSU1IRGxodGRnMEs?oc=5" target="_blank">Israel strikes south Lebanon after stepping back from Beirut attack</a>&nbsp;&nbsp;<font color="#6f6f6f">Reuters</font></li></ol>`;

function testParser() {
  console.log("Testing parseAlsoReportedPublishers...");
  
  // Test case 1: with main publisher = "AP News"
  console.log("\nCase 1: Main Publisher = AP News (should exclude AP News)");
  const res1 = parseAlsoReportedPublishers(sampleHtml, "AP News");
  console.log("Result:", res1);
  
  // Test case 2: with main publisher = "Al Jazeera" (should exclude Al Jazeera)
  console.log("\nCase 2: Main Publisher = Al Jazeera (should exclude Al Jazeera)");
  const res2 = parseAlsoReportedPublishers(sampleHtml, "Al Jazeera");
  console.log("Result:", res2);
  
  // Test case 3: empty HTML
  console.log("\nCase 3: Empty HTML");
  const res3 = parseAlsoReportedPublishers("");
  console.log("Result:", res3);
}

testParser();
