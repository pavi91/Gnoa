import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2, 
  X, 
  AlertTriangle, 
  ChevronLeft,
  ChevronRight,
  Info 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { MembershipFormDoc } from './MembershipForm';

const ITEMS_PER_PAGE = 10;

const MemberList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Delete Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Details Modal State
  const [detailsMember, setDetailsMember] = useState(null);

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

  // Helper
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
    setDownloadingId(member.id);
    try {
      // FIX: Check for 'dob' (database column) or 'dateOfBirth' (frontend alias)
      const dobValue = member.dob || member.dateOfBirth;

      const pdfData = {
        fullName: member.fullName || 'N/A',
        email: member.email || 'N/A',
        designation: member.designation || 'N/A',
        officialAddress: member.officialAddress || 'N/A',
        personalAddress: member.personalAddress || 'N/A',
        dob: dobValue ? new Date(dobValue) : null, // Updated here
        firstAppointmentDate: member.firstAppointmentDate ? new Date(member.firstAppointmentDate) : null,
        mobile: member.phoneNumber || 'N/A',
        gender: member.gender || 'N/A',
        maritalStatus: member.maritalStatus || 'N/A',
        employmentNumber: member.employmentNumber || 'N/A',
        university: member.collegeUniversity || 'N/A',
        signature: member.signature || null,
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


  // Handle Verify
  const handleVerify = (member) => {
    // FIX: Check for 'dob' or 'dateOfBirth'
    const dobValue = member.dob || member.dateOfBirth;

    const memberData = {
      fullName: member.fullName || '',
      email: member.email || '',
      nicNumber: member.nicNumber || '',
      dob: dobValue ? new Date(dobValue).toISOString().split('T')[0] : '', // Updated here
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
    
    navigate('/add', { state: { member: memberData } });
  };

  // Delete Modal Handlers
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
      console.log(`Simulating delete for member ID: ${memberToDelete.id}`);
      await new Promise(resolve => setTimeout(resolve, 750)); 
      
      refresh(); 
      closeDeleteModal(); 

    } catch (error) {
      console.error("Error deleting member:", error);
    } finally {
      setDeletingId(null); 
    }
  };

  // filtering logic
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

  // pagination reset effect
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);


  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  const membersOnPage = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // --- Loading State ---
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

  // Helper component for Data Rows in Modal
  const DetailRow = ({ label, value }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 font-medium break-words">{value || "—"}</dd>
    </div>
  );

  // --- Main Component JSX ---
  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Applications</h2>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold text-[#800000]">{filteredMembers.length}</span> members matching
            {filterStatus !== 'all' && ` • ${filterStatus}`}
            {searchTerm && ` • "${searchTerm}"`}
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

      {/* --- FILTERS --- */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search members by name, email or NIC"
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

      {/* --- ERROR & EMPTY STATES --- */}
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

      {/* --- MEMBERS TABLE --- */}
      {membersOnPage.length > 0 && (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                          member.status === 'Verified'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        
                        {/* Info Button */}
                        <button
                          onClick={() => setDetailsMember(member)}
                          className="inline-flex items-center justify-center p-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none transition-colors"
                          title="View Details"
                        >
                          <Info className="h-4 w-4" />
                        </button>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadPDF(member)}
                          disabled={downloadingId === member.id || deletingId === member.id}
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
                        {member.status === 'Pending' && (
                          <button 
                            onClick={() => handleVerify(member)}
                            disabled={deletingId === member.id || downloadingId === member.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Verify
                          </button>
                        )}
                        
                        {/* Status Badge (Non-pending) */}
                        {member.status !== 'Pending' && (
                          <span 
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                          >
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteModal(member)}
                          disabled={downloadingId === member.id || deletingId === member.id}
                          className="inline-flex items-center justify-center p-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                          title="Delete Member"
                        >
                          {deletingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PAGINATION CONTROL --- */}
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

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
        >
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <button 
              onClick={closeDeleteModal}
              disabled={!!deletingId}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-bold text-gray-900">
                  Are you sure you want to delete?
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Accepting this will permanently remove the record
                    {memberToDelete?.fullName && (
                      <span className="font-medium text-gray-700"> for {memberToDelete.fullName}</span>
                    )}
                    . This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:space-x-4 sm:space-x-reverse">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!!deletingId}
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50 disabled:cursor-wait"
              >
                {deletingId === memberToDelete?.id ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Accept changes'
                )}
              </button>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
                className="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {detailsMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#800000] text-white flex items-center justify-center shadow-md">
                   {detailsMember.profile?.avatarUrl ? (
                     <img src={detailsMember.profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover"/>
                   ) : (
                     <span className="text-lg font-bold">
                       {detailsMember.fullName ? detailsMember.fullName.charAt(0) : "U"}
                     </span>
                   )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailsMember.fullName}</h3>
                  <p className="text-sm text-gray-500">{detailsMember.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setDetailsMember(null)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 shadow-sm border border-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-6 flex-1 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Information */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-[#800000] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <User size={16} /> Personal Information
                  </h4>
                  <div className="space-y-1">
                    <DetailRow label="NIC Number" value={detailsMember.nicNumber} />
                    {/* FIX: Check both 'dob' and 'dateOfBirth' */}
                    <DetailRow label="Date of Birth" value={detailsMember.dob || detailsMember.dateOfBirth} />
                    <DetailRow label="Gender" value={detailsMember.gender} />
                    <DetailRow label="Marital Status" value={detailsMember.maritalStatus} />
                    <DetailRow label="Age" value={detailsMember.age} />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-[#800000] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Phone size={16} /> Contact Details
                  </h4>
                  <div className="space-y-1">
                    <DetailRow label="Mobile" value={detailsMember.phoneNumber} />
                    <DetailRow label="WhatsApp" value={detailsMember.whatsappNumber} />
                    <DetailRow label="Personal Address" value={detailsMember.personalAddress} />
                    <DetailRow label="Official Address" value={detailsMember.officialAddress} />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-[#800000] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <ShieldCheck size={16} /> Professional Info
                  </h4>
                  <div className="space-y-1">
                    <DetailRow label="Designation" value={detailsMember.designation} />
                    <DetailRow label="Employment Number" value={detailsMember.employmentNumber} />
                    <DetailRow label="First Appointment" value={detailsMember.firstAppointmentDate} />
                    <DetailRow label="Organization Type" value={detailsMember.organizationType} />
                    <DetailRow label="Province" value={detailsMember.province} />
                    <DetailRow label="District" value={detailsMember.district} />
                    {/* <DetailRow label="RDHS" value={detailsMember.rdhs} /> */}
                    <DetailRow label="Current Status" value={detailsMember.currentStatus} />
                  </div>
                </div>

                {/* Educational Info */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-[#800000] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Calendar size={16} /> Educational Qualifications
                  </h4>
                  <div className="space-y-1">
                    <DetailRow label="College / University" value={detailsMember.collegeUniversity} />
                    <DetailRow label="Nursing Council Reg." value={detailsMember.nursingCouncilNumber} />
                    <DetailRow label="Qualifications" value={detailsMember.educationalQualifications} />
                    <DetailRow label="Specialties" value={detailsMember.specialties?.join(', ')} />
                  </div>
                </div>

                {/* Signature (Full Width) */}
                {detailsMember.signatureUrl && (
                  <div className="md:col-span-2 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <h4 className="text-sm font-bold text-[#800000] mb-4 pb-2 border-b border-gray-100">
                       Signature
                    </h4>
                    <div className="flex justify-start">
                       <img 
                          src={detailsMember.signatureUrl} 
                          alt="Signature" 
                          className="max-h-24 border border-gray-200 rounded p-1"
                        />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setDetailsMember(null)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-sm text-sm font-medium"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MemberList;