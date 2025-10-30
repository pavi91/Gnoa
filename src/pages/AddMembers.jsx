import React, { useState, useRef, useEffect } from "react";
import { Search, Upload, Check, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from '../supabaseClient';

// --- SearchableDropdown Component (Unchanged) ---
const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-[#2563EB] transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
            {selectedOption || placeholder}
          </span>
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- AddAppliedMembers Component ---
const AddAppliedMembers = () => {
  const location = useLocation();
  const prefillMember = location.state?.member || {}; 

  const [formData, setFormData] = useState({
    nameInFull: "",
    email: "",
    officialAddress: "",
    personalAddress: "",
    dob: "",
    firstAppointmentDate: "",
    phonePersonal: "",
    whatsappNumber: "",
    gender: "",
    maritalStatus: "",
    employmentNumber: "",
    collegeOfNursing: "",
    nursingCouncilReg: "",
    educationalQuals: "",
    specialties: "",
    signature: null,
    category: "",
    designation: "",
    province: "",
    district: "",
    rdhs: "",
    institution: "",
    nicNumber: "",
  });

  // NOTE: Keeping state definitions even if the display section is commented out.
  const [appliedMembers, setAppliedMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [categoryDesignations, setCategoryDesignations] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch categories
      const { data: catData, error: catError } = await supabase.from("categories").select("id, name");
      if (catError) console.error(catError);
      else setCategories(catData);

      // Fetch provinces
      const { data: provData, error: provError } = await supabase.from("provinces").select("id, name");
      if (provError) console.error(provError);
      else setProvinces(provData);

      // Hardcoded designations per category (since no table)
      setCategoryDesignations({
        "Hospital Services": [
          "Chief Nursing Officer",
          "Deputy Chief Nursing Officer",
          "Senior Nursing Officer",
          "Nursing Officer",
          "Staff Nurse",
          "Ward Manager",
          "Clinical Nurse Specialist",
        ],
        "Public Health": [
          "Public Health Nursing Officer",
          "Community Health Nurse",
          "Health Education Officer",
          "Maternal & Child Health Officer",
          "Disease Surveillance Officer",
          "Health Promotion Officer",
        ],
        "Education": [
          "Nursing Tutor",
          "Senior Nursing Tutor",
          "Principal - School of Nursing",
          "Vice Principal - School of Nursing",
          "Lecturer in Nursing",
          "Clinical Instructor",
        ],
      });

      // Fetch applied members (still needed for initial data sync/cleanup)
      const { data: membersData, error: membersError } = await supabase.from("form_responses").select("*");
      if (membersError) console.error(membersError);
      else setAppliedMembers(membersData);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.province) {
        const provinceId = provinces.find(p => p.name === formData.province)?.id;
        if (provinceId) {
          const { data, error } = await supabase.from("districts").select("id, name").eq("province_id", provinceId);
          if (error) console.error(error);
          else {
            setDistricts(data);
            setFormData(prev => ({ ...prev, district: "", institution: "" }));
          }
        }
      } else {
        setDistricts([]);
        setInstitutions([]);
      }
    };
    fetchDistricts();
  }, [formData.province, provinces]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (formData.category && formData.province && formData.district) {
        const categoryId = categories.find(c => c.name === formData.category)?.id;
        const provinceId = provinces.find(p => p.name === formData.province)?.id;
        const districtId = districts.find(d => d.name === formData.district)?.id;
        if (categoryId && provinceId && districtId) {
          const { data, error } = await supabase
            .from("institutions")
            .select("name")
            .eq("category_id", categoryId)
            .eq("province_id", provinceId)
            .eq("district_id", districtId);
          if (error) console.error(error);
          else setInstitutions(data.map(i => i.name));
        }
      } else {
        setInstitutions([]);
      }
    };
    fetchInstitutions();
  }, [formData.category, formData.province, formData.district, categories, provinces, districts]);

  // --- PREFILL LOGIC ---
  useEffect(() => {
    if (Object.keys(prefillMember).length > 0) {
      setFormData(prev => ({
        ...prev,
        // Personal Information
        nameInFull: prefillMember.fullName || "",
        email: prefillMember.email || "", 
        officialAddress: prefillMember.officialAddress || "",
        personalAddress: prefillMember.personalAddress || "",
        dob: prefillMember.dob || "", 
        phonePersonal: prefillMember.mobile || "", 
        whatsappNumber: prefillMember.whatsappNumber || "", 
        gender: prefillMember.gender || "", 
        maritalStatus: prefillMember.maritalStatus || "", 
        nicNumber: prefillMember.nicNumber || "", 

        // Designation & Work Place
        category: prefillMember.category || "", 
        designation: prefillMember.designation || "",
        province: prefillMember.province || "",
        district: prefillMember.district || "",
        rdhs: prefillMember.rdhs || "",
        institution: prefillMember.institution || "", 

        // Employment Details
        firstAppointmentDate: prefillMember.firstAppointmentDate || "", 
        employmentNumber: prefillMember.employmentNumber || "",
        collegeOfNursing: prefillMember.university || "",
        nursingCouncilReg: prefillMember.nursingCouncilReg || "", 
        educationalQuals: prefillMember.educationalQuals || "",
        specialties: prefillMember.specialties || "",

        // Signature
        signature: prefillMember.signature || null, 
      }));
    }
  }, [prefillMember]);
  // --- END PREFILL LOGIC ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };

    if (name === "category") {
      updates.designation = "";
      updates.institution = "";
    }
    if (name === "province") {
      updates.district = "";
      updates.institution = "";
    }
    if (name === "district") {
      updates.institution = "";
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSelectChange = (name, value) => {
    const updates = { [name]: value };

    if (name === "category") {
      updates.designation = "";
      updates.institution = "";
    }
    if (name === "province") {
      updates.district = "";
      updates.institution = "";
    }
    if (name === "district") {
      updates.institution = "";
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, signature: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const responseData = {
      email: formData.email,
      gender: formData.gender,
      designation: formData.designation,
      nic_number: formData.nicNumber,
      name_in_full: formData.nameInFull, 
      marital_status: formData.maritalStatus,
      whatsapp_number: formData.whatsappNumber,
      official_address: formData.officialAddress,
      personal_address: formData.personalAddress,
      district_work_place: formData.district,
      province_work_place: formData.province,
      rdhs: formData.rdhs,
      phone_number_personal: formData.phonePersonal,
      educational_qualifications: formData.educationalQuals,
      employment_number_salary_number: formData.employmentNumber,
      type_of_organization_hospital: formData.institution,
      college_of_nursing_university: formData.collegeOfNursing,
      nursing_council_registration_number: formData.nursingCouncilReg,
      specialties_special_trainings: formData.specialties,
      signature: formData.signature,
      timestamp: new Date().toISOString(),
      dob: formData.dob, 
      first_appointment_date: formData.firstAppointmentDate,
    };

    const { error } = await supabase.from("form_responses").insert([responseData]);
    if (error) console.error("Supabase Insert Error:", error);
    else {
      // NOTE: We refetch applied members but no longer display them.
      const { data, error: fetchError } = await supabase.from("form_responses").select("*");
      if (fetchError) console.error(fetchError);
      else setAppliedMembers(data);

      // Reset form
      setFormData({
        nameInFull: "",
        email: "",
        officialAddress: "",
        personalAddress: "",
        dob: "",
        firstAppointmentDate: "",
        phonePersonal: "",
        whatsappNumber: "",
        gender: "",
        maritalStatus: "",
        employmentNumber: "",
        collegeOfNursing: "",
        nursingCouncilReg: "",
        educationalQuals: "",
        specialties: "",
        signature: null,
        category: "",
        designation: "",
        province: "",
        district: "",
        rdhs: "",
        institution: "",
        nicNumber: "",
      });
    }
  };

  const handleRemoveMember = async (id) => {
    const { error } = await supabase.from("form_responses").delete().eq("id", id);
    if (error) console.error(error);
    else {
      setAppliedMembers(appliedMembers.filter(m => m.id !== id));
    }
  };


  // --- NEW SIGNATURE HELPER FUNCTIONS ---
  const getEmbedUrl = (url) => {
    if (!url || url.startsWith('data:')) {
      return url;
    }
    if (url.includes('drive.google.com')) {
      let fileId = null;
      const openMatch = url.match(/id=([^&]+)/);
      const dMatch = url.match(/\/d\/([^/]+)/);

      if (openMatch && openMatch[1]) {
        fileId = openMatch[1];
      } else if (dMatch && dMatch[1]) {
        fileId = dMatch[1];
      }

      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    return url; 
  };

  const handleImageClick = (url) => {
    if (url && url.includes('drive.google.com')) {
      window.open(url, '_blank');
    } else if (url && url.startsWith('data:')) {
      const newWindow = window.open();
      newWindow.document.write(`<img src="${url}" alt="Signature" style="max-width: 100%; height: auto;">`);
    }
  };
  // --- END NEW SIGNATURE HELPER FUNCTIONS ---


  return (
    // ✅ FIX: Removed bg-[#F4F7F8] to let the white Layout background show through
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#2563EB] to-[#800000] px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              Government Nursing Officers' Association
            </h1>
            <p className="text-blue-100 text-center mt-2">Membership Application Form</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name in Full <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nameInFull"
                    value={formData.nameInFull}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nicNumber"
                    value={formData.nicNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter NIC number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phonePersonal"
                    value={formData.phonePersonal}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select marital status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Official Address
                  </label>
                  <input
                    type="text"
                    name="officialAddress"
                    value={formData.officialAddress}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter official address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Address
                  </label>
                  <input
                    type="text"
                    name="personalAddress"
                    value={formData.personalAddress}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter personal address"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]">
                Designation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.category && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    >
                      <option value="">Select designation</option>
                      {categoryDesignations[formData.category]?.map((des, idx) => (
                        <option key={idx} value={des}>
                          {des}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]">
                Work Place
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select province</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.name}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.province && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    >
                      <option value="">Select district</option>
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.district && (
                  <div className="fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution <span className="text-red-500">*</span>
                    </label>
                    <SearchableDropdown
                      options={institutions}
                      value={formData.institution}
                      onChange={(value) => handleSelectChange("institution", value)}
                      placeholder="Search and select institution..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RDHS
                  </label>
                  <input
                    type="text"
                    name="rdhs"
                    value={formData.rdhs}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter RDHS"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]">
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="firstAppointmentDate"
                    value={formData.firstAppointmentDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment / Salary Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employmentNumber"
                    value={formData.employmentNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter employment number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College of Nursing / University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="collegeOfNursing"
                    value={formData.collegeOfNursing}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter college or university"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nursing Council Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nursingCouncilReg"
                    value={formData.nursingCouncilReg}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter registration number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Educational Qualifications
                  </label>
                  <textarea
                    name="educationalQuals"
                    value={formData.educationalQuals}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter educational qualifications"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialties / Special Trainings
                  </label>
                  <textarea
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                    placeholder="Enter specialties or special trainings"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]">
                Signature
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Signature <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {/* --- PREVIEW LOGIC (Form Data) --- */}
                  {formData.signature && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <img
                        src={getEmbedUrl(formData.signature)} // Use embeddable link for preview
                        alt="Signature Preview"
                        className="h-12 w-32 object-contain border border-gray-300 rounded cursor-pointer"
                        onClick={() => handleImageClick(formData.signature)} // Handle click to open full size
                        title="Click to view full image"
                      />
                    </div>
                  )}
                  {/* --- END PREVIEW LOGIC --- */}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#800000] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>

        {/* // --- APPLIED MEMBERS LIST SECTION (COMMENTED OUT) ---
          ... (This section remains commented out) ...
        */}
      </div>

      <style>{`
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AddAppliedMembers;