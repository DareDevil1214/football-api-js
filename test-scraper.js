// test-scraper.js - Test script to verify scraping functionality
const { testScraping } = require('./api/scraper');

// Test URLs for each source
const testUrls = {
  '90mins': 'https://www.90min.com/manchester-united-report-bruno-fernandes-exit-in-focus-with-huge-offer-on-table',
  'onefootball': 'https://onefootball.com/en/news/arsenal-report-joan-garcia-has-shock-agreement-in-principle-to-snub-arsenal',
  'espn': 'https://www.espn.in/football/story/_/id/41999999/sample-article',
  'goal': 'https://www.goal.com/en-in/lists/jude-bellingham-goes-wild-ibiza-girlfriend-ashlyn-castro-brother-jobe-real-madrid-sunderland-stars-enjoy-vip-treatment-wayne-lineker-o-beach',
  'fourfourtwo-epl': 'https://www.fourfourtwo.com/news/manchester-united-report-bruno-fernandes-exit-in-focus-with-huge-offer-on-table'
};

async function runTests() {
  console.log('🚀 Starting scraper tests...\n');
  
  for (const [source, url] of Object.entries(testUrls)) {
    try {
      await testScraping(url, source);
      console.log('\n' + '='.repeat(50));
      
      // Add delay between tests to be respectful
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Test failed for ${source}:`, error.message);
    }
  }
  
  console.log('\n✅ All tests completed!');
  process.exit(0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };