import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // adjust path as needed
import { Search, RotateCcw } from "lucide-react";

const ExMember = () => {
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    gender: "",
    designation: "",
    nic: "",
    phone: "",
    address: "",
    dateFrom: "",
    dateTo: "",
  });

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Handle filter field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch all members on mount and when page changes
  useEffect(() => {
    fetchMembers();
  }, [page]);

  // Apply filters
  const applyFilters = async () => {
    setLoading(true);

    let query = supabase.from("form_responses").select("*", { count: "exact" });

    if (filters.name)
      query = query.ilike("name_in_full", `%${filters.name}%`);

    if (filters.email)
      query = query.ilike("email", `%${filters.email}%`);

    if (filters.gender)
      query = query.eq("gender", filters.gender);

    if (filters.designation)
      query = query.ilike("designation", `%${filters.designation}%`);

    if (filters.nic)
      query = query.ilike("nic_number", `%${filters.nic}%`);

    if (filters.phone) {
      query = query.or(
        `phone_number_personal.ilike.%${filters.phone}%,whatsapp_number.ilike.%${filters.phone}%`
      );
    }

    if (filters.address) {
      query = query.or(
        `official_address.ilike.%${filters.address}%,personal_address.ilike.%${filters.address}%`
      );
    }

    if (filters.dateFrom)
      query = query.gte("created_at", filters.dateFrom);

    if (filters.dateTo)
      query = query.lte("created_at", filters.dateTo);

    query = query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Filter error:", error);
    } else {
      setMembers(data);
      setTotal(count || 0);
    }

    setLoading(false);
  };

  // Fetch all members (no filters)
  const fetchMembers = async () => {
    setLoading(true);
    const { data, count, error } = await supabase
      .from("form_responses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setMembers(data);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  // Reset filters and reload all members
  const resetFilters = () => {
    setFilters({
      name: "",
      email: "",
      gender: "",
      designation: "",
      nic: "",
      phone: "",
      address: "",
      dateFrom: "",
      dateTo: "",
    });
    setPage(1);
    fetchMembers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Member Directory</h2>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Search by Name"
                value={filters.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="text"
                name="email"
                placeholder="Search by Email"
                value={filters.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
              <select
                name="gender"
                value={filters.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                placeholder="Search by Designation"
                value={filters.designation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">NIC</label>
              <input
                type="text"
                name="nic"
                placeholder="Search by NIC"
                value={filters.nic}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="Search by Phone"
                value={filters.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Search by Address"
                value={filters.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={applyFilters}
              className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              <Search className="w-5 h-5 mr-2" /> Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
            >
              <RotateCcw className="w-5 h-5 mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Gender</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Designation</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">NIC</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.name_in_full || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.email || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.gender || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.designation || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.nic_number || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.phone_number_personal || m.whatsapp_number || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{m.official_address || m.personal_address || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 bg-white rounded-xl shadow-md p-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
                page === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-600 font-medium">
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
                page === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExMember;