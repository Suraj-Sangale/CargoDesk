import fs from 'fs';
import mysql from 'serverless-mysql';
import jwt from 'jsonwebtoken';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    if (k) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const secret = envVars.SECRET_KEY || 'test_secret_key';
const validToken = jwt.sign(
  {
    userId: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@cargodesk.com',
    role: 'superadmin',
  },
  secret,
  { expiresIn: '2h' }
);

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('FLEET MAINTENANCE MODULE - COMPREHENSIVE TEST SUITE');
  console.log('====================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Vehicle Selection Dropdown API
    console.log('\n--- 1. Testing Vehicle Selection Dropdown ---');
    const vehRes = await fetch(`${BASE_URL}/api/vehicles`);
    const vehJson = await vehRes.json();
    assert(vehRes.ok && vehJson.status === true, 'GET /api/vehicles returns status: true');
    assert(Array.isArray(vehJson.data) && vehJson.data.length > 0, `Vehicles loaded: ${vehJson.data?.length || 0} vehicles`);
    const testVehicle = vehJson.data[0];
    const testVehicleId = testVehicle.id;
    console.log(`Using Test Vehicle: ID ${testVehicleId} (${testVehicle.vehicle_number} - ${testVehicle.vehicle_model})`);

    // 2. Presigned Uploads Validation & Security
    console.log('\n--- 2. Testing Presigned Uploads & Security ---');
    // Unauthorized request
    const unauthPresign = await fetch(`${BASE_URL}/api/maintenance/uploads/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: testVehicleId, files: [{ fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 1024 }] }),
    });
    assert(unauthPresign.status === 401, 'Rejects unauthenticated presign request with HTTP 401');

    // Invalid vehicle ID
    const invalidVehPresign = await fetch(`${BASE_URL}/api/maintenance/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({ vehicleId: 9999999, files: [{ fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 1024 }] }),
    });
    assert(invalidVehPresign.status === 404, 'Rejects non-existent vehicle ID with HTTP 404');

    // Invalid file type
    const invalidTypePresign = await fetch(`${BASE_URL}/api/maintenance/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({ vehicleId: testVehicleId, files: [{ fileName: 'malicious.exe', mimeType: 'application/x-msdownload', fileSize: 1024 }] }),
    });
    assert(invalidTypePresign.status === 400, 'Rejects disallowed executable/file type with HTTP 400');

    // Oversized image file (> 10MB)
    const oversizedPresign = await fetch(`${BASE_URL}/api/maintenance/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({ vehicleId: testVehicleId, files: [{ fileName: 'huge.jpg', mimeType: 'image/jpeg', fileSize: 15 * 1024 * 1024 }] }),
    });
    assert(oversizedPresign.status === 400, 'Rejects oversized image (> 10MB) with HTTP 400');

    // Valid presigned upload generation
    const validPresign = await fetch(`${BASE_URL}/api/maintenance/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({
        vehicleId: testVehicleId,
        files: [
          { fileName: 'engine_inspection.jpg', mimeType: 'image/jpeg', fileSize: 2 * 1024 * 1024 },
          { fileName: 'exhaust_video.mp4', mimeType: 'video/mp4', fileSize: 15 * 1024 * 1024 },
        ],
      }),
    });
    const presignData = await validPresign.json();
    assert(validPresign.ok && presignData.status === true, 'Generates valid presigned S3 upload URLs');
    assert(Array.isArray(presignData.data) && presignData.data.length === 2, 'Returns presigned upload descriptors for 2 files');
    assert(presignData.data[0].s3Key.startsWith(`fleet/maintenance/${testVehicleId}/`), 'Generates safe, structured S3 object keys');

    // 3. Create Maintenance Record
    console.log('\n--- 3. Testing Create Maintenance Record ---');
    // Validation: Missing description
    const missingDesc = await fetch(`${BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        maintenance_type: 'Engine Repair',
        description: '',
        maintenance_date: '2026-10-25',
      }),
    });
    assert(missingDesc.status === 400, 'Rejects missing description with HTTP 400');

    // Validation: Negative cost
    const negativeCost = await fetch(`${BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        maintenance_type: 'Engine Repair',
        description: 'Oil leak repair',
        maintenance_date: '2026-10-25',
        cost: -500,
      }),
    });
    assert(negativeCost.status === 400, 'Rejects negative cost with HTTP 400');

    // Create record with media attachments
    const createRes = await fetch(`${BASE_URL}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({
        vehicle_id: testVehicleId,
        maintenance_type: 'Brake Repair',
        description: 'Front and rear brake pads replaced, brake fluid flushed.',
        maintenance_date: '2026-10-25',
        odometer_reading: 98500,
        cost: 6500.50,
        garage_name: 'City Fleet Service Workshop',
        invoice_number: 'INV-TEST-001',
        status: 'Completed',
        additional_notes: 'Brake discs are in good condition.',
        media: [
          {
            s3_key: presignData.data[0].s3Key,
            file_name: 'engine_inspection.jpg',
            mime_type: 'image/jpeg',
            file_size: 2 * 1024 * 1024,
            media_type: 'image',
          },
          {
            s3_key: presignData.data[1].s3Key,
            file_name: 'exhaust_video.mp4',
            mime_type: 'video/mp4',
            file_size: 15 * 1024 * 1024,
            media_type: 'video',
          },
        ],
      }),
    });
    const createJson = await createRes.json();
    assert(createRes.status === 201 && createJson.status === true, 'Creates maintenance record with HTTP 201');
    const createdId = createJson.data?.id;
    assert(Boolean(createdId), `Created Maintenance Record ID: ${createdId}`);
    assert(Array.isArray(createJson.data?.media) && createJson.data.media.length === 2, 'Persists 2 media attachment references in MySQL transaction');

    // 4. List Vehicle Maintenance History & Summaries
    console.log('\n--- 4. Testing Vehicle Maintenance List & Summary Metrics ---');
    const listRes = await fetch(`${BASE_URL}/api/vehicles/${testVehicleId}/maintenance`);
    const listJson = await listRes.json();
    assert(listRes.ok && listJson.status === true, 'GET /api/vehicles/:vehicleId/maintenance returns status: true');
    assert(Array.isArray(listJson.data) && listJson.data.length >= 1, `Fetched ${listJson.data?.length} records for vehicle`);
    assert(listJson.summary && listJson.summary.total_records >= 1, `Summary total_records: ${listJson.summary?.total_records}`);
    assert(listJson.summary && listJson.summary.total_expenditure >= 6500, `Summary total_expenditure: ₹${listJson.summary?.total_expenditure}`);
    assert(listJson.summary && listJson.summary.latest_status === 'Completed', `Summary latest_status: ${listJson.summary?.latest_status}`);

    // 5. Get Maintenance Details
    console.log('\n--- 5. Testing Get Maintenance Details ---');
    const detailRes = await fetch(`${BASE_URL}/api/maintenance/${createdId}`);
    const detailJson = await detailRes.json();
    assert(detailRes.ok && detailJson.status === true, 'GET /api/maintenance/:id returns record details');
    assert(detailJson.data.vehicle_number === testVehicle.vehicle_number, `Vehicle number matches: ${detailJson.data.vehicle_number}`);
    assert(Array.isArray(detailJson.data.media) && detailJson.data.media.length === 2, `Attachments attached: ${detailJson.data.media?.length}`);

    // 6. Update Maintenance Record & Status
    console.log('\n--- 6. Testing Update Maintenance Record ---');
    const updateRes = await fetch(`${BASE_URL}/api/maintenance/${createdId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${validToken}`,
      },
      body: JSON.stringify({
        status: 'In Progress',
        cost: 7200.00,
        additional_notes: 'Updated note: Added sensor alignment check.',
      }),
    });
    const updateJson = await updateRes.json();
    assert(updateRes.ok && updateJson.status === true, 'PATCH /api/maintenance/:id returns status: true');
    assert(updateJson.data.status === 'In Progress', 'Status successfully changed to "In Progress"');
    assert(parseFloat(updateJson.data.cost) === 7200.00, 'Cost successfully updated to 7200.00');

    // 7. Media Signed URL Generation
    console.log('\n--- 7. Testing Media Signed Viewing URL ---');
    const mediaItem = detailJson.data.media[0];
    const mediaUrlRes = await fetch(`${BASE_URL}/api/maintenance/${createdId}/media/${mediaItem.id}/url`, {
      headers: {
        'Cookie': `auth_token=${validToken}`,
      },
    });
    const mediaUrlJson = await mediaUrlRes.json();
    assert(mediaUrlRes.ok && mediaUrlJson.status === true, 'Generates short-lived signed GET URL for authorized media viewing');
    assert(typeof mediaUrlJson.data?.signedUrl === 'string' && mediaUrlJson.data.signedUrl.includes('X-Amz-Signature'), 'Signed URL includes cryptographic AWS Signature');

    // 8. Delete Media Attachment
    console.log('\n--- 8. Testing Delete Media Attachment ---');
    const deleteMediaRes = await fetch(`${BASE_URL}/api/maintenance/${createdId}/media/${mediaItem.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${validToken}`,
      },
    });
    const deleteMediaJson = await deleteMediaRes.json();
    assert(deleteMediaRes.ok && deleteMediaJson.status === true, 'DELETE /api/maintenance/:id/media/:mediaId deletes attachment');

    // Verify media count decreased
    const verifyDetail = await (await fetch(`${BASE_URL}/api/maintenance/${createdId}`)).json();
    assert(verifyDetail.data.media.length === 1, 'Media attachment successfully removed from record (1 remaining)');

    // 9. Delete Maintenance Record
    console.log('\n--- 9. Testing Delete Maintenance Record ---');
    const deleteRecRes = await fetch(`${BASE_URL}/api/maintenance/${createdId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `auth_token=${validToken}`,
      },
    });
    const deleteRecJson = await deleteRecRes.json();
    assert(deleteRecRes.ok && deleteRecJson.status === true, 'DELETE /api/maintenance/:id deletes maintenance record');

    // Verify record no longer exists
    const verifyDelete = await fetch(`${BASE_URL}/api/maintenance/${createdId}`);
    assert(verifyDelete.status === 404, 'Deleted record returns HTTP 404');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
