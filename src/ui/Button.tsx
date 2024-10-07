interface Props {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<Props> = ({
  onClick,
  disabled,
  children
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        borderRadius: '5px',
        backgroundColor: disabled ? '#ccc' : '#007BFF',
        color: disabled ? '#666' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        transition: 'background-color 0.3s ease',
      }}
    >
      {children}
    </button>
  );
};
