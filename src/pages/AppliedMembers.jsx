import React, { useState, useMemo, useEffect } from 'react'; // <--- FIX 1: Import useEffect
import { useNavigate } from 'react-router-dom';
import { useMemberResponses } from '../hooks/useMemberResponses';
import { 
  Loader2, 
  User, 
  Search, 
  Filter,
  Calendar, 
  Phone,
  ShieldCheck, 
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { MembershipFormDoc } from './MembershipForm';

const ITEMS_PER_PAGE = 10;

const MemberList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const navigate = useNavigate();
  
  const {
    members,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    searchMembers,
    getMembersByStatus
  } = useMemberResponses();

  // Helper (No changes)
  const getValidMaritalStatus = (status) => {
    if (status === 'Yes' || status === 'Married') return 'Married';
    if (status === 'No' || status === 'Single') return 'Single';
    if (['Single', 'Married', 'Divorced', 'Widowed'].includes(status)) {
      return status;
    }
    return "";
  };

  // Handle PDF Download
  const handleDownloadPDF = async (member) => {
    // --- FIX 2: Removed setCurrentPage(1) ---
    // Resetting the page on download is probably not desired.
    // setCurrentPage(1); 
    setDownloadingId(member.id);
    try {
      const pdfData = {
        fullName: member.fullName || 'N/A',
        email: member.email || 'N/A',
        designation: member.designation || 'N/A',
        officialAddress: member.officialAddress || 'N/A',
        personalAddress: member.personalAddress || 'N/A',
        dob: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
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
      const safeName = (member.fullName || 'member').replace(/[^a-z0-9]/gi, '_');
      link.download = `Membership_Application_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloadingId(null);
    }
  };


  // Handle Verify (No changes)
  const handleVerify = (member) => {
    const memberData = {
      fullName: member.fullName || '',
      email: member.email || '',
      nicNumber: member.nicNumber || '',
      dob: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      mobile: member.phoneNumber || '',
      whatsappNumber: member.whatsappNumber || '', 
      gender: member.gender || '',
      maritalStatus: getValidMaritalStatus(member.maritalStatus),
      officialAddress: member.officialAddress || '',
      personalAddress: member.personalAddress || '',
      designation: member.designation || '',
      province: member.province || '',
      district: member.district || '',
      rdhs: member.rdhs || '',
      institution: member.organizationType || '',
      firstAppointmentDate: member.firstAppointmentDate 
        ? new Date(member.firstAppointmentDate).toISOString().split('T')[0] 
        : '',
      employmentNumber: member.employmentNumber || '',
      university: member.collegeUniversity || '',
      nursingCouncilReg: member.nursingCouncilNumber || '',
      educationalQuals: member.educationalQualifications || '',
      specialties: member.specialties ? member.specialties.join(', ') : '',
      signature: member.signatureUrl || null,
    };
    
    if (!member.category) {
      console.warn("Warning: Navigating without a 'category'. Dropdown logic in AddMembers may be incomplete.");
    }

    navigate('/add', { state: { member: memberData } });
  };
  
  // --- FIX 3: Removed state update from useMemo ---
  const filteredMembers = useMemo(() => {
    let result = members;
    
    if (searchTerm) {
      result = searchMembers(searchTerm);
    }
    
    if (filterStatus !== 'all') {
      result = getMembersByStatus(filterStatus);
    }
    
    return result;
  }, [members, searchTerm, filterStatus, searchMembers, getMembersByStatus]);

  // --- FIX 4: Added useEffect to handle the side effect ---
  useEffect(() => {
    // This effect will run whenever searchTerm or filterStatus changes.
    // This is the correct place to reset the pagination.
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);


  // --- PAGINATION LOGIC (No changes) ---
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  const membersOnPage = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // -------------------------

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#800000] mx-auto mb-4" />
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* --- HEADER (No changes) --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Members Directory</h2>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold text-[#800000]">{filteredMembers.length}</span> members matching
            {filterStatus !== 'all' && ` • ${filterStatus}`}
            {searchTerm && ` • "${searchTerm}"`}
            {/* --- FIX 5: Prevent Page 1 of 0 --- */}
            <span className="ml-2 text-sm text-gray-400"> (Page {totalPages > 0 ? currentPage : 0} of {totalPages})</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>Refresh</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        </div>
      </div>

      {/* --- FILTERS (No changes) --- */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search members by name, email, NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* --- ERROR & EMPTY STATES (No changes) --- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterStatus !== 'all' ? 'No matching members' : 'No members found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
             Try adjusting your filters or search term.
          </p>
        </div>
      )}

      {/* --- MEMBERS TABLE (No changes) --- */}
      {membersOnPage.length > 0 && (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* ... table head ... */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signature
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membersOnPage.map((member) => ( 
                  <tr key={member.id} className="hover:bg-gray-50">
                    
                    {/* Full Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.profile?.avatarUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={member.profile.avatarUrl}
                              alt={member.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#2563EB] to-[#800000] flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.fullName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.designation || 'N/A'}
                      </div>
                    </td>
                    
                    {/* Phone Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center text-sm text-gray-900">
                          <Phone className="mr-1 h-3 w-3 text-gray-500" />
                          {member.phoneNumber || 'N/A'}
                        </div>
                    </td>
                    
                    {/* Gender */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.gender || 'N/A'}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email || 'N/A'}
                    </td>
                    
                    {/* Added Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        <span>
                          {formatDistanceToNow(new Date(member.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* Signature */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.signatureUrl ? (
                        <img
                          src={member.signatureUrl}
                          alt="Signature"
                          className="h-10 w-24 object-contain rounded"
                          style={{ border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadPDF(member)}
                          disabled={downloadingId === member.id}
                          className="inline-flex items-center justify-center p-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                          title="Download PDF"
                        >
                          {downloadingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>

                        {/* Verify Button (Conditional) */}
                        {member.status === 'pending' && (
                          <button 
                            onClick={() => handleVerify(member)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Verify
                          </button>
                        )}
                        
                        {/* Status Badge (Non-pending) */}
                        {member.status !== 'pending' && (
                          <span 
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                          >
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PAGINATION CONTROL (No changes) --- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredMembers.length)}</span> of{' '}
                <span className="font-medium">{filteredMembers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Simple page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-[#800000] border-[#800000] text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MemberList;