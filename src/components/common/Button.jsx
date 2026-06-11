const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 
        ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;