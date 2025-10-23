export const mapFormResponseToMember = (formResponse) => {
  const data = formResponse.payload || {}; // ✅ all form fields are in payload

  // Base member object structure
  const member = {
    id: formResponse.id,
    user_id: formResponse.user_id || null,
    status: formResponse.status || 'pending',
    created_at: formResponse.created_at,
    updated_at: formResponse.updated_at || null,

    // Personal Information
    fullName: data['Name in full '] || 'Unknown',
    email: data.Email || 'N/A',
    phoneNumber: data['Phone number (personal)'] || null,
    whatsappNumber: data['whatsApp Number'] || null,
    nicNumber: data['NIC number ']?.trim() || null,
    gender: data.Gender || null,
    maritalStatus: data['Marital status'] || null,
    dateOfBirth: data['Date of birth'] ? new Date(data['Date of birth']) : null,

    // Addresses
    personalAddress: data['Personal address'] || null,
    officialAddress: data['Official Address'] || null,

    // Professional Information
    designation: data.Designation || null,
    employmentNumber: data['Employment number/Salary Number'] || null,
    nursingCouncilNumber: data['Nursing council registration Nnumber'] || null,
    educationalQualifications: data['Educational qualifications'] || null,
    collegeUniversity: data['Your College of Nursing/University'] || null,
    specialties: data['Scialities (Special trainings) - If applicable ']
      ? data['Scialities (Special trainings) - If applicable '].split(',')
      : [],

    // Work Information
    organizationType: data['Type of the Organization/Hospital '] || null,
    district: data['District (Work Place)'] || null,
    province: data['Province (Work Place)'] || null,
    rdhs: data['RDHS (if applicable) '] || null,
    firstAppointmentDate: data['First appoinment date']
      ? new Date(data['First appoinment date'])
      : null,

    // Signature
    signatureUrl: data['Signature (Please upload a photo your siganture here)'] || null,

    // Computed fields
    age: data['Date of birth']
      ? Math.floor((new Date() - new Date(data['Date of birth'])) / (365.25 * 24 * 60 * 60 * 1000))
      : null,
    isComplete: isFormComplete(data),
    timestamp: formResponse.Timestamp
      ? new Date(formResponse.Timestamp)
      : new Date(formResponse.created_at),
  };

  console.log('🔄 Mapped member data:', {
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

// Helper function to check if form is complete
const isFormComplete = (data) => {
  const requiredFields = [
    data.Email,
    data['Name in full '],
    data['NIC number '],
    data['Date of birth'],
    data.Designation,
    data['Phone number (personal)'],
    data['Educational qualifications'],
    data['Nursing council registration Nnumber']
  ];

  return requiredFields.every(field => field && field.toString().trim() !== '');
};
