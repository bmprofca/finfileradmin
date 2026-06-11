export const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'white',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db', // blue-500 or gray-300
    borderRadius: '0.75rem', // rounded-xl (from Services.jsx)
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none', // focus:ring-blue-500
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af' // gray-400
    },
    minHeight: '38px',
    fontSize: '0.875rem'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#2563eb' // blue-600 
      : state.isFocused 
        ? '#eff6ff' // blue-50
        : 'white',
    color: state.isSelected ? 'white' : '#374151', // gray-700
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:active': {
      backgroundColor: state.isSelected ? '#1d4ed8' : '#dbeafe' // blue-700 or blue-100
    }
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 9999,
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  singleValue: (provided) => ({
    ...provided,
    color: '#374151', // gray-700
    fontSize: '0.875rem'
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 8px'
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af', // gray-400
    padding: '4px 8px',
    '&:hover': {
      color: '#6b7280' // gray-500
    }
  })
};

export const getReactSelectMenuProps = () => ({
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
});
