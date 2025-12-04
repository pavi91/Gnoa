import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import { 
  Loader2, 
  User, 
  Filter, 
  Download, 
  Trash2, 
  X, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Briefcase, 
  Phone, 
  ShieldCheck, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { MembershipFormDoc } from './MembershipForm';

const ITEMS_PER_PAGE = 10;

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

const CATEGORY_DESIGNATIONS = {
    "Hospital Services": ["Chief Nursing Officer", "Deputy Chief Nursing Officer", "Senior Nursing Officer", "Nursing Officer", "Staff Nurse", "Ward Manager", "Clinical Nurse Specialist"],
    "Education": ["Nursing Tutor", "Senior Nursing Tutor", "Principal - School of Nursing", "Vice Principal - School of Nursing", "Lecturer in Nursing", "Clinical Instructor"],
};

const MemberList = () => {
  // --- STATE: Filters ---
  const [filters, setFilters] = useState({
    gender: '',
    nicNumber: '', // Changed from maritalStatus to nicNumber
    category: '',
    province: '',
    district: '',
    designation: '',
    institution: ''
  });
  
  const [filterStatus, setFilterStatus] = useState('all');

  // --- STATE: Data ---
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE: Dropdown Options ---
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [provincesOptions, setProvincesOptions] = useState([]);
  const [districtsOptions, setDistrictsOptions] = useState([]);
  const [institutionsOptions, setInstitutionsOptions] = useState([]);

  // --- STANDARD STATES ---
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [detailsMember, setDetailsMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();

  // --- HELPER: Map DB Columns to UI Format ---
  const transformData = (data) => {
    return data.map(item => ({
      id: item.id,
      timestamp: item.created_at,
      fullName: item.name_in_full,
      email: item.email,
      nicNumber: item.nic_number,
      dob: item.dob,
      phoneNumber: item.phone_number_personal,
      whatsappNumber: item.whatsapp_number,
      gender: item.gender,
      maritalStatus: item.marital_status,
      officialAddress: item.official_address,
      personalAddress: item.personal_address,
      category: item.category,
      designation: item.designation,
      institution: item.type_of_organization_hospital,
      province: item.province_work_place,
      district: item.district_work_place,
      rdhs: item.rdhs,
      firstAppointmentDate: item.first_appointment_date,
      employmentNumber: item.employment_number_salary_number,
      nursingCouncilNumber: item.nursing_council_registration_number,
      collegeUniversity: item.college_of_nursing_university,
      educationalQualifications: item.educational_qualifications,
      specialties: item.specialties_special_trainings,
      signatureUrl: item.signature,
      status: item.status || 'Pending',
    }));
  };

  const isDirectLocation = (category) => DIRECT_LOCATION_CATEGORIES.includes(category);
  const isTextInputDesignation = (category) => TEXT_INPUT_DESIGNATION_CATEGORIES.includes(category);

  // --- 1. FETCH FILTER OPTIONS ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: catData } = await supabase.from("categories").select("id, name");
      if (catData) setCategoriesOptions(catData);

      const { data: provData } = await supabase.from("provinces").select("id, name");
      if (provData) setProvincesOptions(provData);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (isDirectLocation(filters.category)) {
        setDistrictsOptions([]);
        return;
      }
      if (filters.province) {
        const provinceId = provincesOptions.find(p => p.name === filters.province)?.id;
        if (provinceId) {
          const { data } = await supabase.from("districts").select("id, name").eq("province_id", provinceId);
          if (data) setDistrictsOptions(data);
        }
      } else {
        setDistrictsOptions([]);
      }
    };
    fetchDistricts();
  }, [filters.province, provincesOptions, filters.category]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!filters.category) {
        setInstitutionsOptions([]);
        return;
      }
      const categoryId = categoriesOptions.find(c => c.name === filters.category)?.id;
      if (!categoryId) return;

      if (isDirectLocation(filters.category)) {
        const { data } = await supabase.from("institutions").select("name").eq("category_id", categoryId);
        if (data) setInstitutionsOptions(data.map(i => i.name));
      } 
      else if (filters.province && filters.district) {
        const provinceId = provincesOptions.find(p => p.name === filters.province)?.id;
        const districtId = districtsOptions.find(d => d.name === filters.district)?.id;
        
        if (provinceId && districtId) {
          const { data } = await supabase.from("institutions").select("name")
            .eq("category_id", categoryId).eq("province_id", provinceId).eq("district_id", districtId);
          if (data) setInstitutionsOptions(data.map(i => i.name));
        }
      } else {
        setInstitutionsOptions([]);
      }
    };
    fetchInstitutions();
  }, [filters.category, filters.province, filters.district, categoriesOptions, provincesOptions, districtsOptions]);


  // --- 2. FETCH MEMBERS ---
  const fetchFilteredMembers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('form_responses')
        .select('*') 
        .order('created_at', { ascending: false });

      if (filterStatus === 'pending') query = query.eq('status', 'Pending');
      else if (filterStatus === 'approved') query = query.eq('status', 'Verified'); 
      else if (filterStatus === 'rejected') query = query.eq('status', 'Rejected');

      if (filters.category) query = query.eq('category', filters.category);
      
      if (filters.category && !isDirectLocation(filters.category)) {
          if (filters.province) query = query.eq('province_work_place', filters.province);
          if (filters.district) query = query.eq('district_work_place', filters.district);
      }

      if (filters.institution) query = query.eq('type_of_organization_hospital', filters.institution);
      
      if (filters.designation) {
        if (isTextInputDesignation(filters.category)) {
           query = query.ilike('designation', `%${filters.designation}%`);
        } else {
           query = query.eq('designation', filters.designation);
        }
      }

      if (filters.gender) query = query.eq('gender', filters.gender);
      
      // NIC Search Logic (Partial Match)
      if (filters.nicNumber) {
        query = query.ilike('nic_number', `%${filters.nicNumber}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setMembers(transformData(data || []));

    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredMembers();
  }, [filters, filterStatus]); 


  // --- CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (members.length === 0) return;

    const headers = [
      "ID", "Created At", "Full Name", "Email", "NIC Number", "Date of Birth",
      "Phone Number", "WhatsApp Number", "Gender", "Marital Status",
      "Official Address", "Personal Address",
      "Category", "Designation", "Institution", "Province", "District", "RDHS",
      "First Appointment Date", "Employment Number", "Nursing Council Reg No",
      "College/University", "Educational Qualifications", "Specialties", "Status"
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = members.map(m => [
      m.id,
      m.timestamp,
      m.fullName,
      m.email,
      m.nicNumber,
      m.dob,
      m.phoneNumber,
      m.whatsappNumber,
      m.gender,
      m.maritalStatus,
      m.officialAddress,
      m.personalAddress,
      m.category,
      m.designation,
      m.institution,
      m.province,
      m.district,
      m.rdhs,
      m.firstAppointmentDate,
      m.employmentNumber,
      m.nursingCouncilNumber,
      m.collegeUniversity,
      m.educationalQualifications,
      m.specialties,
      m.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    const categoryStr = filters.category ? `_${filters.category.replace(/\s+/g, '')}` : '';
    link.setAttribute("download", `Member_Export${categoryStr}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HANDLERS ---
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === "category") {
        newFilters.designation = "";
        newFilters.institution = ""; 
        newFilters.province = "";
        newFilters.district = "";
      }
      if (key === "province") {
        newFilters.district = "";
        newFilters.institution = "";
      }
      if (key === "district") {
        newFilters.institution = "";
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      gender: '', nicNumber: '', category: '', province: '',
      district: '', designation: '', institution: ''
    });
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const membersOnPage = members.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleDownloadPDF = async (member) => {
    setDownloadingId(member.id);
    try {
      const pdfData = {
        fullName: member.fullName || 'N/A',
        email: member.email || 'N/A',
        designation: member.designation || 'N/A',
        officialAddress: member.officialAddress || 'N/A',
        personalAddress: member.personalAddress || 'N/A',
        dob: member.dob ? new Date(member.dob) : null,
        firstAppointmentDate: member.firstAppointmentDate ? new Date(member.firstAppointmentDate) : null,
        mobile: member.phoneNumber || 'N/A',
        gender: member.gender || 'N/A',
        maritalStatus: member.maritalStatus || 'N/A',
        employmentNumber: member.employmentNumber || 'N/A',
        university: member.collegeUniversity || 'N/A',
        signature: member.signatureUrl || null,
      };

      const blob = await pdf(<MembershipFormDoc data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Membership_${(member.fullName || 'member').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVerify = (member) => {
      navigate('/add', { state: { member: member } });
  };
  
  const openDeleteModal = (member) => {
    setMemberToDelete(member);
    setIsModalOpen(true);
  };
  const closeDeleteModal = () => {
    if (deletingId) return; 
    setMemberToDelete(null);
    setIsModalOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeletingId(memberToDelete.id);
    try {
      const { error } = await supabase.from('form_responses').delete().eq('id', memberToDelete.id);
      if (error) throw error;
      fetchFilteredMembers(); 
      closeDeleteModal(); 
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeletingId(null); 
    }
  };

  // --- UI COMPONENTS ---
  const FilterSelect = ({ label, value, onChange, options, disabled = false, placeholder = "All" }) => (
    <div className="flex flex-col">
        <label className="text-xs font-semibold text-gray-500 mb-1 ml-1">{label}</label>
        <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#800000] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.name : opt;
            const display = typeof opt === 'object' ? opt.name : opt;
            return <option key={idx} value={val}>{display}</option>
        })}
        </select>
    </div>
  );

  const DetailRow = ({ label, value }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-medium break-words">{value || "—"}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Applications</h2>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold text-[#800000]">{members.length}</span> results found
            <span className="ml-2 text-sm text-gray-400">(Page {totalPages > 0 ? currentPage : 0}/{totalPages})</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
            
            {/* Export CSV Button */}
            <button 
                onClick={handleExportCSV} 
                disabled={loading || members.length === 0}
                className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export current list to CSV"
            >
                <FileSpreadsheet className="w-4 h-4" /> 
                <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors">
                <RefreshCw className="w-4 h-4" /> 
                <span className="hidden sm:inline">Reset</span>
            </button>

            <button onClick={fetchFilteredMembers} disabled={loading} className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] disabled:opacity-50 flex items-center gap-2 text-sm transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 text-[#800000] font-semibold border-b border-gray-100 pb-2">
            <Filter className="w-4 h-4" />
            <h3>Filter Members</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Personal
                </h4>
                <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={["pending", "approved", "rejected"]} />
                <div className="grid grid-cols-2 gap-2">
                    <FilterSelect label="Gender" value={filters.gender} onChange={(v) => handleFilterChange('gender', v)} options={["Male", "Female"]} />
                    {/* Replaced Marital Status with NIC Search */}
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-500 mb-1 ml-1">Search NIC</label>
                        <input
                            type="text"
                            value={filters.nicNumber}
                            onChange={(e) => handleFilterChange('nicNumber', e.target.value)}
                            placeholder="Type NIC..."
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#800000] focus:border-transparent placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Work Place
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                        <FilterSelect 
                            label="Category *"
                            value={filters.category} 
                            onChange={(val) => handleFilterChange('category', val)} 
                            options={categoriesOptions} 
                            placeholder="Select First"
                        />
                    </div>

                    {(!filters.category || !isDirectLocation(filters.category)) && (
                        <>
                            <FilterSelect 
                                label="Province"
                                value={filters.province} 
                                onChange={(val) => handleFilterChange('province', val)} 
                                options={provincesOptions} 
                                disabled={!filters.category} 
                                placeholder={!filters.category ? "Select Category" : "Select Province"}
                            />
                            <FilterSelect 
                                label="District"
                                value={filters.district} 
                                onChange={(val) => handleFilterChange('district', val)} 
                                options={districtsOptions}
                                disabled={!filters.province} 
                                placeholder={!filters.province ? "Select Province" : "Select District"}
                            />
                        </>
                    )}

                    {filters.category && isDirectLocation(filters.category) && (
                        <div className="col-span-2 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 italic">
                            Direct Location selected.
                        </div>
                    )}

                    <FilterSelect 
                        label="Institution"
                        value={filters.institution} 
                        onChange={(val) => handleFilterChange('institution', val)} 
                        options={institutionsOptions} 
                        disabled={!filters.category || (!isDirectLocation(filters.category) && !filters.district)}
                        placeholder="Search Institution"
                    />
                    
                    <div className="lg:col-span-4 md:col-span-2">
                        {filters.category && isTextInputDesignation(filters.category) ? (
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-gray-500 mb-1 ml-1">Designation Search</label>
                                <input
                                    type="text"
                                    value={filters.designation}
                                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                                    placeholder="Type to search..."
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                                />
                            </div>
                        ) : (
                            <FilterSelect 
                                label="Designation"
                                value={filters.designation} 
                                onChange={(val) => handleFilterChange('designation', val)} 
                                options={filters.category ? (CATEGORY_DESIGNATIONS[filters.category] || []) : []} 
                                disabled={!filters.category}
                                placeholder={!filters.category ? "Select Category First" : "Select Designation"}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- TABLE & LIST VIEW --- */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-sm border border-gray-200">
           <div className="text-center">
             <Loader2 className="w-8 h-8 animate-spin text-[#800000] mx-auto mb-2" />
             <p className="text-sm text-gray-500">Fetching data from database...</p>
           </div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matching members found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting the filters above.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membersOnPage.map((member) => ( 
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#800000] flex items-center justify-center text-white">
                           <span className="font-bold text-sm">
                             {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                           </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.designation || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{member.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col text-sm text-gray-900">
                          <span className="font-medium truncate max-w-[150px]" title={member.institution}>
                              {member.institution || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">
                             {member.district || (isDirectLocation(member.category) ? "Direct Ministry" : "-")}
                          </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'Verified' ? 'bg-green-100 text-green-800' : 
                          member.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setDetailsMember(member)} className="p-2 border border-gray-300 rounded text-blue-700 hover:bg-blue-50" title="View"><Info className="h-4 w-4" /></button>
                        <button onClick={() => handleDownloadPDF(member)} disabled={downloadingId === member.id} className="p-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50" title="PDF">
                           {downloadingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </button>
                        {member.status === 'Pending' && (
                          <button onClick={() => handleVerify(member)} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"><ShieldCheck className="h-4 w-4 mr-1" /> Verify</button>
                        )}
                        <button onClick={() => openDeleteModal(member)} className="p-2 border border-gray-300 rounded text-red-700 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
           <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, members.length)}</span> of <span className="font-medium">{members.length}</span> results</p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => handlePageChange(page)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-[#800000] border-[#800000] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
            </nav>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <button onClick={closeDeleteModal} disabled={!!deletingId} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"><X className="h-6 w-6" /></button>
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-bold text-gray-900">Are you sure?</h3>
                <p className="text-sm text-gray-500 mt-2">Permanently delete record for <span className="font-bold">{memberToDelete?.fullName}</span>?</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-2">
              <button onClick={handleConfirmDelete} disabled={!!deletingId} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:text-sm disabled:opacity-50">
                {deletingId ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Delete'}
              </button>
              <button onClick={closeDeleteModal} disabled={!!deletingId} className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">{detailsMember.fullName}</h3>
              <button onClick={() => setDetailsMember(null)} className="p-2 bg-white rounded-full shadow-sm border"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-[#800000]">Personal</h4>
                    <DetailRow label="NIC" value={detailsMember.nicNumber} />
                    <DetailRow label="Email" value={detailsMember.email} />
                    <DetailRow label="Address" value={detailsMember.personalAddress} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-[#800000]">Work</h4>
                    <DetailRow label="Category" value={detailsMember.category} />
                    <DetailRow label="Institution" value={detailsMember.institution} />
                    <DetailRow label="Designation" value={detailsMember.designation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;