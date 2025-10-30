export const mapFormResponseToMember = (formResponse) => {
  // We still need the payload for 'Date of birth' and 'First appoinment date'
  // as they are not listed as generated columns in your SQL.
  const data = formResponse.payload || {}; 

  // --- Calculate dates from payload ---
  const dateOfBirth = data['Date of birth'] ? new Date(data['Date of birth']) : null;
  const firstAppointmentDate = data['First appoinment date']
    ? new Date(data['First appoinment date'])
    : null;

  // Base member object structure
  const member = {
    id: formResponse.id,
    user_id: formResponse.user_id || null,
    status: formResponse.status || 'pending',
    created_at: formResponse.created_at,
    updated_at: formResponse.updated_at || null,

    // --- MAPPED FROM DIRECT COLUMNS ---

    // Personal Information
    fullName: formResponse.name_in_full || 'Unknown',
    email: formResponse.email || 'N/A',
    phoneNumber: formResponse.phone_number_personal || null,
    whatsappNumber: formResponse.whatsapp_number || null,
    nicNumber: formResponse.nic_number 
        ? String(formResponse.nic_number).trim() 
        : null,
    gender: formResponse.gender || null,
    maritalStatus: formResponse.marital_status || null,

    // Addresses
    personalAddress: formResponse.personal_address || null,
    officialAddress: formResponse.official_address || null,

    // Professional Information
    designation: formResponse.designation || null,
    employmentNumber: formResponse.employment_number_salary_number || null,
    nursingCouncilNumber: formResponse.nursing_council_registration_number || null,
    educationalQualifications: formResponse.educational_qualifications || null,
    collegeUniversity: formResponse.college_of_nursing_university || null,
    specialties: formResponse.specialties_special_trainings
      ? formResponse.specialties_special_trainings.split(',')
      : [],

    // Work Information
    organizationType: formResponse.type_of_organization_hospital || null,
    district: formResponse.district_work_place || null,
    province: formResponse.province_work_place || null,
    rdhs: formResponse.rdhs || null,

    // Signature
    signatureUrl: formResponse.signature || null,

    // --- MAPPED FROM PAYLOAD (because not generated columns) ---
    dateOfBirth: dateOfBirth,
    firstAppointmentDate: firstAppointmentDate,

    // --- COMPUTED FIELDS ---
    age: dateOfBirth
      ? Math.floor((new Date() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null,
      
    // Pass both the direct columns and payload data to the helper
    isComplete: isFormComplete(formResponse, data), 
    
    timestamp: formResponse.timestamp // Use the lowercase 'timestamp' generated column
      ? new Date(formResponse.timestamp)
      : new Date(formResponse.created_at),
  };

  console.log('🔄 Mapped member data (from direct columns):', {
    id: member.id,
    fullName: member.fullName,
    email: member.email,
    designation: member.designation,
    status: member.status,
    age: member.age,
    isComplete: member.isComplete
  });

  return member;
};

// --- CORRECTED HELPER FUNCTION ---
// Helper function to check if form is complete
// It must now check the direct columns (from formResponse) and the payload (for dates)
const isFormComplete = (formResponse, data) => {
  const requiredFields = [
    formResponse.email, // from direct column
    formResponse.name_in_full, // from direct column
    formResponse.nic_number, // from direct column
    data['Date of birth'], // from payload
    formResponse.designation, // from direct column
    formResponse.phone_number_personal, // from direct column
    formResponse.educational_qualifications, // from direct column
    formResponse.nursing_council_registration_number // from direct column
  ];

  return requiredFields.every(field => field && field.toString().trim() !== '');
};