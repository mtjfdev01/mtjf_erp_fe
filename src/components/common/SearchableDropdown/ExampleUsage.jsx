import React, { useState } from 'react';
import SearchableDropdown from './index';
import axiosInstance from '../../../utils/axios';

/**
 * Example usage of SearchableDropdown component
 * This file demonstrates different use cases
 */

// Example 1: Basic user search
const UserSearchExample = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSearch = async (searchTerm) => {
    try {
      const response = await axiosInstance.get('/users/search', {
        params: { q: searchTerm }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  };

  const handleUserSelect = (user) => {
    console.log('Selected user:', user);
    setSelectedUser(user);
  };

  return (
    <SearchableDropdown
      label="Assign to User"
      placeholder="Search users by name or email..."
      onSearch={handleUserSearch}
      onSelect={handleUserSelect}
      value={selectedUser}
      displayKey="first_name" // or use custom render
      debounceDelay={500}
      minSearchLength={2}
      required
    />
  );
};

// Example 2: Custom render for options
const CustomRenderExample = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = async (searchTerm) => {
    const response = await axiosInstance.get('/users/search', {
      params: { q: searchTerm }
    });
    return response.data.data || [];
  };

  const customRenderOption = (user, index) => (
    <div 
      key={user.id}
      className="custom-user-option"
      onClick={() => setSelectedUser(user)}
      style={{ 
        padding: '12px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {user.first_name} {user.last_name}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {user.email} • {user.department || 'No department'}
      </div>
      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
        Role: {user.role || 'User'}
      </div>
    </div>
  );

  return (
    <SearchableDropdown
      label="Select Team Member"
      placeholder="Search by name, email, or department..."
      onSearch={handleSearch}
      onSelect={setSelectedUser}
      renderOption={customRenderOption}
      value={selectedUser}
      debounceDelay={300}
      minSearchLength={3}
    />
  );
};

// Example 3: In a form
const FormExample = () => {
  const [formData, setFormData] = useState({
    donor_name: '',
    assigned_user: null,
    amount: ''
  });

  const handleUserSearch = async (searchTerm) => {
    const response = await axiosInstance.get('/users/search', {
      params: { q: searchTerm }
    });
    return response.data.data || [];
  };

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      assigned_user: user
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data:', {
      ...formData,
      assigned_user_id: formData.assigned_user?.id
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <input
          type="text"
          value={formData.donor_name}
          onChange={(e) => setFormData(prev => ({ ...prev, donor_name: e.target.value }))}
          placeholder="Donor Name"
        />
        
        <SearchableDropdown
          label="Assign to User"
          placeholder="Search users..."
          onSearch={handleUserSearch}
          onSelect={handleUserSelect}
          value={formData.assigned_user}
          name="assigned_user"
          required
        />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
};

// Example 4: With clear callback
const WithClearExample = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleClear = () => {
    console.log('Selection cleared');
    setSelectedUser(null);
    // Do any additional cleanup
  };

  return (
    <SearchableDropdown
      label="Assigned User"
      onSearch={async (term) => {
        const response = await axiosInstance.get('/users/search', { params: { q: term } });
        return response.data.data;
      }}
      onSelect={setSelectedUser}
      onClear={handleClear}
      value={selectedUser}
    />
  );
};

export {
  UserSearchExample,
  CustomRenderExample,
  FormExample,
  WithClearExample
};

