const axios = require('axios');

async function testPackageDetailsEndpoint() {
  console.log('🧪 TESTING PACKAGE DETAILS ENDPOINT FIX');
  console.log('===============================================');
  
  const baseUrl = 'http://localhost:3002';
  
  try {
    // 1. Test Health Check
    console.log('\n[1/4] 🔍 Testing Health Check...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    console.log('✅ Health Check OK:', healthResponse.data.status);
    
    // 2. Test Packages List
    console.log('\n[2/4] 📦 Testing Packages List...');
    const packagesResponse = await axios.get(`${baseUrl}/api/packages`);
    console.log(`✅ Packages List OK: ${packagesResponse.data.data?.length || 0} packages`);
    
    if (packagesResponse.data.data && packagesResponse.data.data.length > 0) {
      const firstPackage = packagesResponse.data.data[0];
      console.log(`📦 First package ID: ${firstPackage.id}`);
      console.log(`📦 First package title: ${firstPackage.title}`);
      
      // 3. Test Package Details
      console.log('\n[3/4] 🔍 Testing Package Details...');
      try {
        const detailsResponse = await axios.get(`${baseUrl}/api/packages/${encodeURIComponent(firstPackage.id)}`);
        console.log('✅ Package Details OK');
        console.log(`📋 Package: ${detailsResponse.data.package?.title}`);
        console.log(`📋 Destination: ${detailsResponse.data.package?.destination}`);
        console.log(`📋 Price: ${detailsResponse.data.package?.price?.amount} ${detailsResponse.data.package?.price?.currency}`);
        console.log(`📋 Images: ${detailsResponse.data.package?.images?.gallery?.length || 0} images`);
        console.log(`📋 Description: ${detailsResponse.data.package?.description?.short?.substring(0, 100)}...`);
      } catch (detailsError) {
        console.error('❌ Package Details Error:', detailsError.response?.data || detailsError.message);
      }
    }
    
    // 4. Test Featured
    console.log('\n[4/4] ⭐ Testing Featured Packages...');
    const featuredResponse = await axios.get(`${baseUrl}/api/packages/featured`);
    console.log(`✅ Featured Packages OK: ${featuredResponse.data.data?.length || 0} featured`);
    
    console.log('\n🎉 TESTING COMPLETED!');
    console.log('===============================================');
    console.log('✅ RESULT: Package Details Modal should now work correctly');
    console.log('🌐 Next step: Open http://localhost:3005/paquetes and test modal');
    
  } catch (error) {
    console.error('❌ ERROR DURING TESTING:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 TIP: Make sure backend is running on port 3002');
      console.log('💡 Run: npm start in backend directory');
    }
  }
}

// Auto-run if this file is executed directly
if (require.main === module) {
  testPackageDetailsEndpoint();
}

module.exports = testPackageDetailsEndpoint;
