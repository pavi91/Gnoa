import React, { useState, useRef, useEffect } from "react";
import { Search, Check, AlertCircle, Loader2, Eraser, PenTool } from "lucide-react";
import { supabase } from '../supabaseClient';
import SignatureCanvas from 'react-signature-canvas';

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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-[#2563EB] active:ring-2 active:ring-blue-100 transition-colors select-none"
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
            {value || placeholder}
          </span>
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-colors text-sm text-gray-700"
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-gray-500 text-center text-sm">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- ExternalMembers Component ---
const ExternalMembers = () => {
  
  const sigPadRef = useRef({});

  // --- CONFIGURATION ---
  const DIRECT_LOCATION_CATEGORIES = [
    "Line Ministry", 
    "Nursing Training School"
  ];

  const TEXT_INPUT_DESIGNATION_CATEGORIES = [
    "Line Ministry", 
    "Nursing Training School", 
    "Public Health", 
    "RDHS", 
    "MOH Divisions"
  ];

  // --- Security: Honeypot State ---
  const [honeypot, setHoneypot] = useState(""); 
   
  // --- UI States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    nameInFull: "", email: "", officialAddress: "", personalAddress: "",
    dob: "", firstAppointmentDate: "", phonePersonal: "", whatsappNumber: "",
    gender: "", maritalStatus: "", employmentNumber: "", collegeOfNursing: "",
    nursingCouncilReg: "", educationalQuals: "", specialties: "", signature: null,
    category: "", designation: "", province: "", district: "",
    rdhs: "", institution: "", nicNumber: "",
  });

  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // --- HELPER FUNCTIONS ---
  const isDirectLocation = (category) => DIRECT_LOCATION_CATEGORIES.includes(category);
  const isTextInputDesignation = (category) => TEXT_INPUT_DESIGNATION_CATEGORIES.includes(category);
   
  const categoryDesignations = {
    "Hospital Services": ["Chief Nursing Officer", "Deputy Chief Nursing Officer", "Senior Nursing Officer", "Nursing Officer", "Staff Nurse", "Ward Manager", "Clinical Nurse Specialist"],
    "Education": ["Nursing Tutor", "Senior Nursing Tutor", "Principal - School of Nursing", "Vice Principal - School of Nursing", "Lecturer in Nursing", "Clinical Instructor"],
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: catData } = await supabase.from("categories").select("id, name");
      if (catData) setCategories(catData);

      const { data: provData } = await supabase.from("provinces").select("id, name");
      if (provData) setProvinces(provData);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (isDirectLocation(formData.category)) {
        setDistricts([]);
        return;
      }
      if (formData.province) {
        const provinceId = provinces.find(p => p.name === formData.province)?.id;
        if (provinceId) {
          const { data } = await supabase.from("districts").select("id, name").eq("province_id", provinceId);
          if (data) {
            setDistricts(data);
            setFormData(prev => ({ ...prev, district: "", institution: "" }));
          }
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [formData.province, provinces, formData.category]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!formData.category) {
        setInstitutions([]);
        return;
      }
      const categoryId = categories.find(c => c.name === formData.category)?.id;
      if (!categoryId) return;

      if (isDirectLocation(formData.category)) {
        const { data } = await supabase.from("institutions").select("name").eq("category_id", categoryId);
        if (data) setInstitutions(data.map(i => i.name));
      } 
      else if (formData.province && formData.district) {
        const provinceId = provinces.find(p => p.name === formData.province)?.id;
        const districtId = districts.find(d => d.name === formData.district)?.id;
        
        if (provinceId && districtId) {
          const { data } = await supabase.from("institutions").select("name").eq("category_id", categoryId).eq("province_id", provinceId).eq("district_id", districtId);
          if (data) setInstitutions(data.map(i => i.name));
        }
      } else {
        setInstitutions([]);
      }
    };
    fetchInstitutions();
  }, [formData.category, formData.province, formData.district, categories, provinces, districts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    if (name === "category") {
        updates.designation = "";
        updates.institution = ""; 
        if (isDirectLocation(value)) {
            updates.province = "";
            updates.district = "";
            updates.rdhs = "";
        }
    }
    if (name === "province") Object.assign(updates, { district: "", institution: "" });
    if (name === "district") Object.assign(updates, { institution: "" });
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSelectChange = (name, value) => {
     const updates = { [name]: value };
     setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSignatureEnd = () => {
    if (sigPadRef.current) {
        const signatureData = sigPadRef.current.toDataURL(); 
        setFormData(prev => ({ ...prev, signature: signatureData }));
        if(submitStatus.message && submitStatus.message.includes("signature")) {
            setSubmitStatus({ type: "", message: "" });
        }
    }
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
        sigPadRef.current.clear();
        setFormData(prev => ({ ...prev, signature: null }));
    }
  };

  const validateForm = () => {
    const required = [
      "nameInFull", "email", "nicNumber", "dob", "phonePersonal", 
      "gender", "category", "firstAppointmentDate", "employmentNumber", 
      "collegeOfNursing", "nursingCouncilReg", "signature", "designation", "institution"
    ];
    if (formData.category && !isDirectLocation(formData.category)) {
        required.push("province", "district");
    }
    for (let field of required) {
      if (!formData[field]) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: "", message: "" });

    if (honeypot) {
      setSubmitStatus({ type: "success", message: "Application submitted successfully!" });
      return;
    }

    if (!validateForm()) {
      setSubmitStatus({ type: "error", message: "Please fill in all required fields marked with *" });
      window.scrollTo(0,0);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanData = {
        category: formData.category,
        email: formData.email.trim(),
        gender: formData.gender,
        designation: formData.designation.trim(),
        nic_number: formData.nicNumber.trim().toUpperCase(),
        name_in_full: formData.nameInFull.trim(), 
        marital_status: formData.maritalStatus,
        whatsapp_number: formData.whatsappNumber.trim(),
        official_address: formData.officialAddress.trim(),
        personal_address: formData.personalAddress.trim(),
        district_work_place: formData.district,
        province_work_place: formData.province,
        rdhs: formData.rdhs.trim(),
        phone_number_personal: formData.phonePersonal.trim(),
        educational_qualifications: formData.educationalQuals.trim(),
        employment_number_salary_number: formData.employmentNumber.trim(),
        type_of_organization_hospital: formData.institution,
        college_of_nursing_university: formData.collegeOfNursing.trim(),
        nursing_council_registration_number: formData.nursingCouncilReg.trim(),
        specialties_special_trainings: formData.specialties.trim(),
        signature: formData.signature,
        dob: formData.dob, 
        first_appointment_date: formData.firstAppointmentDate,
      };

      const { error } = await supabase.from("form_responses").insert([cleanData]);

      if (error) throw error;

      setSubmitStatus({ type: "success", message: "Application submitted successfully!" });
      
      if (sigPadRef.current) sigPadRef.current.clear();

      setFormData({
        nameInFull: "", email: "", officialAddress: "", personalAddress: "", dob: "",
        firstAppointmentDate: "", phonePersonal: "", whatsappNumber: "", gender: "",
        maritalStatus: "", employmentNumber: "", collegeOfNursing: "", nursingCouncilReg: "",
        educationalQuals: "", specialties: "", signature: null, category: "", designation: "",
        province: "", district: "", rdhs: "", institution: "", nicNumber: "",
      });
      window.scrollTo(0,0);

    } catch (error) {
      console.error("Submission Error:", error);
      setSubmitStatus({ type: "error", message: "Failed to submit. Please check your connection or try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-white border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all outline-none appearance-none";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6">
      {/* Main Container - Widened to max-w-3xl for PC */}
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border-t-8 border-[#2563EB]">
        
        {/* Header - Google Form style Top Card */}
        <div className="px-8 py-8 text-center border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Government Nursing Officers' Association
          </h1>
          <p className="text-gray-600 text-lg mt-3">Membership Application Form</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Status Messages */}
          {submitStatus.message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{submitStatus.message}</p>
            </div>
          )}

          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
             <label htmlFor="website_url">Do not fill this field</label>
             <input type="text" id="website_url" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex="-1" autoComplete="off" />
          </div>

          {/* Personal Information */}
          <section className="bg-white">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-[#2563EB] w-1.5 h-6 mr-3 rounded-full"></span>
              Personal Information
            </h3>
            
            <div className="space-y-5">
              {/* Full Width Fields */}
              <div>
                <label className={labelClass}>Name in Full <span className="text-red-500">*</span></label>
                <input type="text" name="nameInFull" value={formData.nameInFull} onChange={handleChange} className={inputClass} placeholder="Full Name" />
              </div>
              <div>
                <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" name="email" inputMode="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="example@email.com" />
              </div>

              {/* Grid Layout for PC: 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className={labelClass}>NIC Number <span className="text-red-500">*</span></label>
                  <input type="text" name="nicNumber" value={formData.nicNumber} onChange={handleChange} className={inputClass} />
                 </div>
                 <div>
                  <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Mobile <span className="text-red-500">*</span></label>
                  <input type="tel" name="phonePersonal" value={formData.phonePersonal} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number</label>
                  <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={inputClass}>
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={labelClass}>Personal Address</label>
                <textarea name="personalAddress" value={formData.personalAddress} onChange={handleChange} className={inputClass} rows={2} />
              </div>

              <div>
                <label className={labelClass}>Official Address</label>
                <textarea name="officialAddress" value={formData.officialAddress} onChange={handleChange} className={inputClass} rows={2} />
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section: Designation & Workplace */}
          <section>
             <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-[#2563EB] w-1.5 h-6 mr-3 rounded-full"></span>
              Work Place
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              {formData.category && !isDirectLocation(formData.category) && (
                <div className="fade-in space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Province <span className="text-red-500">*</span></label>
                      <select name="province" value={formData.province} onChange={handleChange} className={inputClass}>
                        <option value="">Select</option>
                        {provinces.map((prov) => <option key={prov.id} value={prov.name}>{prov.name}</option>)}
                      </select>
                    </div>
                    {formData.province && (
                      <div className="fade-in">
                        <label className={labelClass}>District <span className="text-red-500">*</span></label>
                        <select name="district" value={formData.district} onChange={handleChange} className={inputClass}>
                          <option value="">Select</option>
                          {districts.map((dist) => <option key={dist.id} value={dist.name}>{dist.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* RDHS Field (Optional based on previous code) */}
                  <div className="fade-in">
                    <label className={labelClass}>RDHS Division</label>
                    <input type="text" name="rdhs" value={formData.rdhs} onChange={handleChange} className={inputClass} placeholder="Regional Director of Health Services" />
                  </div>

                </div>
              )}

              {(isDirectLocation(formData.category) || formData.district) && (
                <div className="fade-in">
                    <label className={labelClass}>Institution <span className="text-red-500">*</span></label>
                    <SearchableDropdown
                    options={institutions}
                    value={formData.institution}
                    onChange={(value) => handleSelectChange("institution", value)}
                    placeholder="Search Institution..."
                    />
                </div>
              )}

              {formData.category && (
                <div className="fade-in">
                  <label className={labelClass}>Designation <span className="text-red-500">*</span></label>
                  {isTextInputDesignation(formData.category) ? (
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your exact Designation"
                    />
                  ) : (
                    <select name="designation" value={formData.designation} onChange={handleChange} className={inputClass}>
                      <option value="">Select Designation</option>
                      {categoryDesignations[formData.category]?.map((des, idx) => <option key={idx} value={des}>{des}</option>)}
                    </select>
                  )}
                </div>
              )}

            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section: Employment Details */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-[#2563EB] w-1.5 h-6 mr-3 rounded-full"></span>
              Employment Details
            </h3>

            <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>First Appointment <span className="text-red-500">*</span></label>
                        <input type="date" name="firstAppointmentDate" value={formData.firstAppointmentDate} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Emp/Salary No <span className="text-red-500">*</span></label>
                        <input type="text" name="employmentNumber" value={formData.employmentNumber} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Nursing Council Reg No <span className="text-red-500">*</span></label>
                        <input type="text" name="nursingCouncilReg" value={formData.nursingCouncilReg} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>College / University <span className="text-red-500">*</span></label>
                        <input type="text" name="collegeOfNursing" value={formData.collegeOfNursing} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Educational Qualifications</label>
                    <textarea name="educationalQuals" value={formData.educationalQuals} onChange={handleChange} className={inputClass} rows={2} />
                </div>
                 <div>
                    <label className={labelClass}>Specialties</label>
                    <textarea name="specialties" value={formData.specialties} onChange={handleChange} className={inputClass} rows={2} />
                </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section: Signature */}
          <section>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className={labelClass}>Draw Signature <span className="text-red-500">*</span></label>
              
              {/* Signature Canvas Container */}
              <div className="mt-3 border-2 border-[#2563EB] border-dashed rounded-lg bg-white overflow-hidden relative group shadow-inner">
                <SignatureCanvas 
                    ref={sigPadRef}
                    penColor="black"
                    velocityFilterWeight={0.7}
                    canvasProps={{
                        className: "w-full h-48 cursor-crosshair",
                    }}
                    onEnd={handleSignatureEnd}
                />
                
                {/* Overlay Instruction */}
                {!formData.signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                         <div className="flex flex-col items-center">
                            <PenTool className="w-8 h-8 text-gray-500 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Sign Here</p>
                        </div>
                    </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center mt-3">
                 <button
                    type="button"
                    onClick={clearSignature}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                 >
                    <Eraser className="w-4 h-4" />
                    Clear Signature
                 </button>

                 {formData.signature && (
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg border border-green-200">
                        <Check className="w-4 h-4 text-green-700" />
                        <span className="text-sm text-green-700 font-medium">Captured</span>
                    </div>
                 )}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4 pb-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto py-3 px-8 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-lg font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Application"}
            </button>
          </div>

        </form>
      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ExternalMembers;