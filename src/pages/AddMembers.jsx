import React, { useState, useRef, useEffect } from "react";
import { Search, Upload, Check, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from '../supabaseClient';

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
        className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-[#2563EB] transition-colors" /* UPDATED HOVER */
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]" /* UPDATED RING */
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

      // Fetch applied members
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

  useEffect(() => {
    if (Object.keys(prefillMember).length > 0) {
      setFormData(prev => ({
        ...prev,
        nameInFull: prefillMember.name_in_full || "",
        email: prefillMember.email || "",
        officialAddress: prefillMember.official_address || "",
        personalAddress: prefillMember.personal_address || "",
        phonePersonal: prefillMember.phone_number_personal || "",
        whatsappNumber: prefillMember.whatsapp_number || "",
        gender: prefillMember.gender || "",
        maritalStatus: prefillMember.marital_status || "",
        employmentNumber: prefillMember.employment_number_salary_number || "",
        collegeOfNursing: prefillMember.college_of_nursing_university || "",
        nursingCouncilReg: prefillMember.nursing_council_registration_number || "",
        educationalQuals: prefillMember.educational_qualifications || "",
        specialties: prefillMember.specialties_special_trainings || "",
        category: prefillMember.category || "", // assuming added
        designation: prefillMember.designation || "",
        province: prefillMember.province_work_place || "",
        district: prefillMember.district_work_place || "",
        rdhs: prefillMember.rdhs || "",
        institution: prefillMember.type_of_organization_hospital || "",
        nicNumber: prefillMember.nic_number || "",
        // dob and firstAppointmentDate in payload if needed
      }));
    }
  }, [prefillMember]);

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
    const payload = JSON.stringify({
      dob: formData.dob,
      firstAppointmentDate: formData.firstAppointmentDate,
      // any other fields not in columns
    });
    const responseData = {
      payload,
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
    };

    const { error } = await supabase.from("form_responses").insert([responseData]);
    if (error) console.error(error);
    else {
      // Refetch applied members
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

  return (
    <div className="min-h-screen bg-[#F4F7F8] py-12 px-4"> {/* UPDATED BG */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* UPDATED HEADER GRADIENT */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#800000] px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              Government Nursing Officers' Association
            </h1>
            <p className="text-blue-100 text-center mt-2">Membership Application Form</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]"> {/* UPDATED BORDER */}
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
                    placeholder="Enter personal address"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]"> {/* UPDATED BORDER */}
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]"> {/* UPDATED BORDER */}
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
                    placeholder="Enter RDHS"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]"> {/* UPDATED BORDER */}
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all" /* UPDATED RING */
                    placeholder="Enter specialties or special trainings"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-[#2563EB]"> {/* UPDATED BORDER */}
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
                  {formData.signature && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className="h-12 w-32 object-contain border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#800000] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" /* UPDATED GRADIENT */
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>

        {appliedMembers.length > 0 && (
          <div className="mt-8 bg-white shadow-xl rounded-2xl overflow-hidden">
            {/* UPDATED HEADER BG */}
            <div className="bg-[#2563EB] px-8 py-4">
              <h3 className="text-2xl font-bold text-white">Applied Members ({appliedMembers.length})</h3>
            </div>
            <div className="p-6 space-y-4">
              {appliedMembers.map((m) => (
                <div key={m.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">{m.name_in_full || "N/A"}</h4>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{m.email || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-600">{m.phone_number_personal || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">Designation:</span> <span className="text-gray-600">{m.designation || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">Province:</span> <span className="text-gray-600">{m.province_work_place || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">District:</span> <span className="text-gray-600">{m.district_work_place || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">Institution:</span> <span className="text-gray-600">{m.type_of_organization_hospital || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">Employment No:</span> <span className="text-gray-600">{m.employment_number_salary_number || "N/A"}</span></div>
                    <div><span className="font-medium text-gray-700">University:</span> <span className="text-gray-600">{m.college_of_nursing_university || "N/A"}</span></div>
                  </div>
                  {m.signature && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="font-medium text-gray-700">Signature:</span>
                      <img
                        src={m.signature}
                        alt="Signature"
                        className="mt-2 h-12 w-32 object-contain border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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