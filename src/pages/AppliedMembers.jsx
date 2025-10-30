import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberResponses } from '../hooks/useMemberResponses';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Search, 
  Filter,
  CheckCircle,
  ShieldCheck, // New icon for Verify button
  Sigma, // Placeholder for Gender/Age since we removed the second row for NIC
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { MembershipFormDoc } from './MembershipForm';

const MemberList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // Navigate to AddAppliedMembers with member data
  const getValidMaritalStatus = (status) => {
    if (status === 'Yes' || status === 'Married') return 'Married';
    if (status === 'No' || status === 'Single') return 'Single';
    // Add other known bad values
    
    // Check if it's already a valid value
    if (['Single', 'Married', 'Divorced', 'Widowed'].includes(status)) {
      return status;
    }
    
    return ""; // Default to empty
  };

  // Navigate to AddAppliedMembers with member data
  const handleVerify = (member) => {
    // Map fields to match AddAppliedMembers formData
    const memberData = {
      // --- Personal Info ---
      fullName: member.fullName || '',
      email: member.email || '',
      nicNumber: member.nicNumber || '',
      dob: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      mobile: member.phoneNumber || '',
      whatsappNumber: member.whatsappNumber || '', // <-- ADDED
      gender: member.gender || '',

      maritalStatus: getValidMaritalStatus(member.maritalStatus),
      
      officialAddress: member.officialAddress || '',
      personalAddress: member.personalAddress || '',

      // --- Designation & Work Place ---
      // Note: We prefill the *value* of designation/institution.
      // The user may need to re-select Category/Province/District 
      // to re-populate the dropdowns if they wish to change them.
      designation: member.designation || '',
      province: member.province || '',             // <-- ADDED
      district: member.district || '',           // <-- ADDED
      rdhs: member.rdhs || '',                   // <-- ADDED
      institution: member.organizationType || '',  // <-- MAPPED (organizationType -> institution)

      // --- Employment Details ---
      firstAppointmentDate: member.firstAppointmentDate 
        ? new Date(member.firstAppointmentDate).toISOString().split('T')[0] 
        : '',
      employmentNumber: member.employmentNumber || '',
      university: member.collegeUniversity || '',
      nursingCouncilReg: member.nursingCouncilNumber || '', // <-- MAPPED (nursingCouncilNumber -> nursingCouncilReg)
      educationalQuals: member.educationalQualifications || '', // <-- MAPPED (educationalQualifications -> educationalQuals)
      specialties: member.specialties ? member.specialties.join(', ') : '', // <-- MAPPED (array -> string)

      // --- Signature ---
      signature: member.signatureUrl || null,
    };
    
    // The category is missing, so we'll log a warning if it's not in the member object.
    // The AddMembers form logic depends on it.
    if (!member.category) {
      console.warn("Warning: Navigating without a 'category'. Dropdown logic in AddMembers may be incomplete.");
      // You might need to add: memberData.category = 'Some Default Category' if you can derive it.
    }

    navigate('/add', { state: { member: memberData } });
  };
  // Apply filters
  const filteredMembers = React.useMemo(() => {
    let result = members;
    
    if (searchTerm) {
      result = searchMembers(searchTerm);
    }
    
    if (filterStatus !== 'all') {
      result = getMembersByStatus(filterStatus);
    }
    
    return result;
  }, [members, searchTerm, filterStatus, searchMembers, getMembersByStatus]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#333]">Members Directory</h2>
          <p className="text-gray-600 mt-1">
            {filteredMembers.length} of {members.length} members
            {filterStatus !== 'all' && ` • ${filterStatus}`}
            {searchTerm && ` • "${searchTerm}"`}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        {/* Search */}
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

        {/* Status Filter */}
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

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterStatus !== 'all' ? 'No matching members' : 'No members found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? `Try a different search term like "${searchTerm}"` : 
             filterStatus !== 'all' ? 'Try adjusting your filters' : 
             'Get started by having users submit the membership form.'}
          </p>
        </div>
      )}

      {/* Members Table */}
      {filteredMembers.length > 0 && (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* UPDATED COLUMNS */}
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
                    <span className="sr-only">Verify</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
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
                          {/* Removed second line: member.nicNumber */}
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.designation || 'N/A'}
                      </div>
                       {/* Removed second line: member.organizationType */}
                    </td>
                    
                    {/* Phone Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center text-sm text-gray-900">
                          <Phone className="mr-1 h-3 w-3 text-gray-500" />
                          {member.phoneNumber || 'N/A'}
                        </div>
                         {/* Removed second line: member.whatsappNumber */}
                    </td>
                    
                    {/* Gender */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.gender || 'N/A'}
                       {/* Removed second line: member.age */}
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
                          {formatDistanceToNow(member.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                       {/* Removed second line: member.age */}
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
                      {/* Removed second line: member.isComplete */}
                    </td>

                    {/* Actions / Verify Button */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.status === 'pending' && (
                        <button 
                          onClick={() => handleVerify(member)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Verify
                        </button>
                      )}
                      {member.status !== 'pending' && (
                        <button 
                            disabled 
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                        >
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && filteredMembers.length < members.length && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#800000] hover:bg-[#600000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading more members...
              </>
            ) : (
              `Load More (${members.length - filteredMembers.length} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberList;