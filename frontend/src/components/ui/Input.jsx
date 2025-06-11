import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text',
  className = '',
  required = false,
  ...props 
}, ref) => {
  const inputClasses = `input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
