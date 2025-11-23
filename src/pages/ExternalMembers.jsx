import React, { useState, useRef, useEffect } from "react";
import { Search, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from '../supabaseClient';

// --- SearchableDropdown Component (Optimized for Mobile) ---
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

const ExternalMembers = () => {
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
  
  // Hardcoded for performance/fallback
  const categoryDesignations = {
    "Hospital Services": ["Chief Nursing Officer", "Deputy Chief Nursing Officer", "Senior Nursing Officer", "Nursing Officer", "Staff Nurse", "Ward Manager", "Clinical Nurse Specialist"],
    "Public Health": ["Public Health Nursing Officer", "Community Health Nurse", "Health Education Officer", "Maternal & Child Health Officer", "Disease Surveillance Officer", "Health Promotion Officer"],
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
  }, [formData.province, provinces]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (formData.category && formData.province && formData.district) {
        const categoryId = categories.find(c => c.name === formData.category)?.id;
        const provinceId = provinces.find(p => p.name === formData.province)?.id;
        const districtId = districts.find(d => d.name === formData.district)?.id;
        if (categoryId && provinceId && districtId) {
          const { data } = await supabase
            .from("institutions").select("name")
            .eq("category_id", categoryId).eq("province_id", provinceId).eq("district_id", districtId);
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
    
    // Security: Input Sanitization (allow typing but sanitize on submit)
    const updates = { [name]: value };

    // Reset dependencies
    if (name === "category") Object.assign(updates, { designation: "", institution: "" });
    if (name === "province") Object.assign(updates, { district: "", institution: "" });
    if (name === "district") Object.assign(updates, { institution: "" });

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSelectChange = (name, value) => {
     // Identical logic to handleChange for select inputs
     const updates = { [name]: value };
     setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSubmitStatus({ type: "", message: "" });

    if (file) {
      // SECURITY: Validate File Type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setSubmitStatus({ type: "error", message: "Only JPG, PNG, or WEBP images allowed." });
        return;
      }

      // SECURITY: Validate File Size (Max 500KB to prevent DB bloat/DoS)
      if (file.size > 500 * 1024) {
        setSubmitStatus({ type: "error", message: "Signature image must be less than 500KB." });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, signature: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const required = [
      "nameInFull", "email", "nicNumber", "dob", "phonePersonal", 
      "gender", "category", "province", "district", 
      "institution", "firstAppointmentDate", "employmentNumber", 
      "collegeOfNursing", "nursingCouncilReg", "signature"
    ];
    
    for (let field of required) {
      if (!formData[field]) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: "", message: "" });

    // SECURITY: Honeypot Check
    if (honeypot) {
      console.log("Bot detected");
      // Fake success to fool the bot
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
      // SECURITY: Sanitize string inputs before sending
      const cleanData = {
        email: formData.email.trim(),
        gender: formData.gender,
        designation: formData.designation,
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
        signature: formData.signature, // already validated size/type
        timestamp: new Date().toISOString(),
        dob: formData.dob, 
        first_appointment_date: formData.firstAppointmentDate,
      };

      const { error } = await supabase.from("form_responses").insert([cleanData]);

      if (error) throw error;

      setSubmitStatus({ type: "success", message: "Application submitted successfully!" });
      // Clear form
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

  // Shared input style class
  const inputClass = "w-full bg-white border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all outline-none appearance-none";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-lg mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#800000] px-6 py-6 text-center">
          <h1 className="text-2xl font-bold text-white leading-tight">
            Government Nursing Officers' Association
          </h1>
          <p className="text-blue-100 text-sm mt-2 font-medium">Membership Application Form</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Status Messages */}
          {submitStatus.message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{submitStatus.message}</p>
            </div>
          )}

          {/* SECURITY: Honeypot Field (Hidden) */}
          <div className="hidden" aria-hidden="true">
             <label htmlFor="website_url">Do not fill this field</label>
             <input type="text" id="website_url" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex="-1" autoComplete="off" />
          </div>

          {/* Section: Personal Info */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#2563EB] pl-3 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Name in Full <span className="text-red-500">*</span></label>
                <input type="text" name="nameInFull" value={formData.nameInFull} onChange={handleChange} className={inputClass} placeholder="Full Name" />
              </div>

              <div>
                <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" name="email" inputMode="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="example@email.com" />
              </div>

              <div>
                <label className={labelClass}>NIC Number <span className="text-red-500">*</span></label>
                <input type="text" name="nicNumber" value={formData.nicNumber} onChange={handleChange} className={inputClass} placeholder="NIC Number" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Personal Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="phonePersonal" inputMode="tel" value={formData.phonePersonal} onChange={handleChange} className={inputClass} placeholder="07X XXXXXXX" />
              </div>

              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <input type="tel" name="whatsappNumber" inputMode="tel" value={formData.whatsappNumber} onChange={handleChange} className={inputClass} placeholder="07X XXXXXXX" />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <label className={labelClass}>Official Address</label>
                <textarea name="officialAddress" value={formData.officialAddress} onChange={handleChange} className={inputClass} rows={2} placeholder="Hospital/Institute Address" />
              </div>
              
              <div>
                <label className={labelClass}>Personal Address</label>
                <textarea name="personalAddress" value={formData.personalAddress} onChange={handleChange} className={inputClass} rows={2} placeholder="Home Address" />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section: Designation & Workplace */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#2563EB] pl-3 mb-4">Work Place</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              {formData.category && (
                <div className="fade-in">
                  <label className={labelClass}>Designation <span className="text-red-500">*</span></label>
                  <select name="designation" value={formData.designation} onChange={handleChange} className={inputClass}>
                    <option value="">Select Designation</option>
                    {categoryDesignations[formData.category]?.map((des, idx) => <option key={idx} value={des}>{des}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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

              {formData.district && (
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

              <div>
                <label className={labelClass}>RDHS</label>
                <input type="text" name="rdhs" value={formData.rdhs} onChange={handleChange} className={inputClass} placeholder="RDHS Area" />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section: Employment Details */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#2563EB] pl-3 mb-4">Employment Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className={labelClass}>First Appointment Date <span className="text-red-500">*</span></label>
                    <input type="date" name="firstAppointmentDate" value={formData.firstAppointmentDate} onChange={handleChange} className={inputClass} />
                 </div>
              </div>

              <div>
                <label className={labelClass}>Emp/Salary Number <span className="text-red-500">*</span></label>
                <input type="text" name="employmentNumber" value={formData.employmentNumber} onChange={handleChange} className={inputClass} placeholder="Employment Number" />
              </div>

              <div>
                <label className={labelClass}>College / University <span className="text-red-500">*</span></label>
                <input type="text" name="collegeOfNursing" value={formData.collegeOfNursing} onChange={handleChange} className={inputClass} placeholder="School of Nursing" />
              </div>

              <div>
                <label className={labelClass}>Nursing Council Reg No <span className="text-red-500">*</span></label>
                <input type="text" name="nursingCouncilReg" value={formData.nursingCouncilReg} onChange={handleChange} className={inputClass} placeholder="Registration Number" />
              </div>

              <div>
                <label className={labelClass}>Educational Qualifications</label>
                <textarea name="educationalQuals" value={formData.educationalQuals} onChange={handleChange} className={inputClass} rows={3} placeholder="Diploma, Degree, MSc..." />
              </div>

              <div>
                <label className={labelClass}>Specialties / Training</label>
                <textarea name="specialties" value={formData.specialties} onChange={handleChange} className={inputClass} rows={3} placeholder="ICU, Midwifery, etc." />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Section: Signature */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#2563EB] pl-3 mb-4">Declaration</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <label className={labelClass}>Upload Signature (Max 500KB) <span className="text-red-500">*</span></label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#2563EB] border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-[#2563EB] mb-2" />
                    <p className="text-sm text-gray-500"><span className="font-semibold">Tap to upload</span> image</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>

              {formData.signature && (
                <div className="mt-4 flex items-center gap-3 bg-green-100 p-3 rounded border border-green-200">
                  <Check className="w-5 h-5 text-green-700" />
                  <span className="text-sm text-green-700 font-medium">Signature uploaded</span>
                  <img src={formData.signature} alt="Preview" className="h-10 w-auto ml-auto border rounded bg-white" />
                </div>
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4 pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#2563EB] to-[#800000] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              By submitting, you certify the information is true.
            </p>
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