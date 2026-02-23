export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
};

export const validatePassword = (password: string): boolean => {
    return PASSWORD_REGEX.test(password);
};
