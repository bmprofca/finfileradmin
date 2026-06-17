export const reactSelectStyles = {
  control: (provided, state) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      ...provided,
      backgroundColor: isDark ? '#374151' : 'white', // gray-700
      borderColor: state.isFocused ? (isDark ? '#3b82f6' : '#3b82f6') : (isDark ? '#4b5563' : '#d1d5db'), // blue-500, gray-600/300
      borderRadius: '0.75rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : (isDark ? '#6b7280' : '#9ca3af') // gray-500/400
      },
      minHeight: '38px',
      fontSize: '0.875rem'
    };
  },
  option: (provided, state) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      ...provided,
      backgroundColor: state.isSelected 
        ? '#2563eb' // blue-600 
        : state.isFocused 
          ? (isDark ? '#4b5563' : '#eff6ff') // gray-600 or blue-50
          : (isDark ? '#1f2937' : 'white'), // gray-800 or white
      color: state.isSelected ? 'white' : (isDark ? '#e5e7eb' : '#374151'), // gray-200 or gray-700
      cursor: 'pointer',
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: state.isSelected ? '#1d4ed8' : (isDark ? '#374151' : '#dbeafe') // blue-700, gray-700, blue-100
      }
    };
  },
  menu: (provided) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      ...provided,
      backgroundColor: isDark ? '#1f2937' : 'white', // gray-800
      borderRadius: '0.75rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
      border: isDark ? '1px solid #374151' : 'none',
    };
  },
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  singleValue: (provided) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      ...provided,
      color: isDark ? '#f3f4f6' : '#374151', // gray-100 or gray-700
      fontSize: '0.875rem'
    };
  },
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 8px'
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  dropdownIndicator: (provided) => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return {
      ...provided,
      color: isDark ? '#9ca3af' : '#9ca3af', // gray-400
      padding: '4px 8px',
      '&:hover': {
        color: isDark ? '#d1d5db' : '#6b7280' // gray-300 or gray-500
      }
    };
  }
};

export const getReactSelectMenuProps = () => ({
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: "fixed",
  menuPlacement: "auto",
});
