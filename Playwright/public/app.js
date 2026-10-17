const defaultUser = {
  id: 901,
  firstName: 'Somchai',
  lastName: 'Tester',
  phoneNumber: '0812345678',
  email: 'somchai@example.com',
  gender: 'male',
  profileImage: '',
  role: 'user',
};

const form = document.getElementById('profileForm');
const firstNameInput = form.elements.firstName;
const lastNameInput = form.elements.lastName;
const phoneInput = form.elements.phoneNumber;
const genderInput = form.elements.gender;
const imageInput = document.getElementById('profileImageInput');
const preview = document.getElementById('profilePreview');
const successMessage = document.getElementById('successMessage');
const serverError = document.getElementById('serverError');
const cancelButton = document.getElementById('cancelButton');

let originalValues = {};
let selectedImage = null;

const readUser = () => {
  const raw = localStorage.getItem('user');
  if (!raw) return { ...defaultUser };
  try {
    return JSON.parse(raw);
  } catch (error) {
    return { ...defaultUser };
  }
};

const setPreview = (src) => {
  preview.src = src || '';
  preview.style.display = src ? 'block' : 'none';
};

const applyValues = (user) => {
  originalValues = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phoneNumber: user.phoneNumber || '',
    gender: user.gender || 'male',
    profileImage: user.profileImage || '',
  };

  firstNameInput.value = originalValues.firstName;
  lastNameInput.value = originalValues.lastName;
  phoneInput.value = originalValues.phoneNumber;
  genderInput.value = originalValues.gender;
  setPreview(originalValues.profileImage || '');
  selectedImage = null;
  resetMessages();
  updateCancelButton();
};

const resetMessages = () => {
  successMessage.style.display = 'none';
  serverError.style.display = 'none';
};

const updateCancelButton = () => {
  const currentValues = {
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
    phoneNumber: phoneInput.value,
    gender: genderInput.value,
  };
  const dirty = JSON.stringify(currentValues) !== JSON.stringify({
    firstName: originalValues.firstName,
    lastName: originalValues.lastName,
    phoneNumber: originalValues.phoneNumber,
    gender: originalValues.gender,
  }) || Boolean(selectedImage);
  cancelButton.hidden = !dirty;
};

const showError = (message) => {
  serverError.textContent = message;
  serverError.style.display = 'block';
};

const validateSelectedFile = (file) => {
  if (!file) return true;

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showError('ประเภทไฟล์ไม่ถูกต้อง');
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    showError('กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5 MB');
    return false;
  }

  return true;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    selectedImage = null;
    updateCancelButton();
    return;
  }

  if (!validateSelectedFile(file)) {
    imageInput.value = '';
    selectedImage = null;
    updateCancelButton();
    return;
  }

  try {
    selectedImage = await readFileAsDataUrl(file);
    setPreview(selectedImage);
    updateCancelButton();
  } catch (error) {
    selectedImage = null;
    updateCancelButton();
  }
});

form.addEventListener('input', (event) => {
  if (event.target !== imageInput) {
    resetMessages();
  }
  updateCancelButton();
});

form.addEventListener('change', (event) => {
  if (event.target !== imageInput) {
    resetMessages();
  }
  updateCancelButton();
});

cancelButton.addEventListener('click', () => {
  firstNameInput.value = originalValues.firstName;
  lastNameInput.value = originalValues.lastName;
  phoneInput.value = originalValues.phoneNumber;
  genderInput.value = originalValues.gender;
  imageInput.value = '';
  selectedImage = null;
  setPreview(originalValues.profileImage || '');
  resetMessages();
  updateCancelButton();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetMessages();

  const firstName = firstNameInput.value.trim();
  if (!firstName) {
    showError('กรุณากรอกชื่อ');
    return;
  }

  const user = readUser();
  const payload = new FormData();
  payload.append('firstName', firstName.trim());
  payload.append('lastName', lastNameInput.value.trim());
  payload.append('phoneNumber', phoneInput.value.trim());
  payload.append('gender', genderInput.value);

  if (selectedImage) {
    const file = imageInput.files && imageInput.files[0];
    if (file) {
      payload.append('profileImage', file);
    }
  }

  try {
    const response = await fetch('/api/v1/users/profile', {
      method: 'PUT',
      body: payload,
    });

    if (!response.ok) {
      showError('เกิดข้อผิดพลาดในระบบ');
      return;
    }

    const result = await response.json();
    const updatedUser = {
      ...user,
      ...result.user,
      firstName: firstName.trim(),
      lastName: lastNameInput.value.trim(),
      phoneNumber: phoneInput.value.trim(),
      gender: genderInput.value,
      profileImage: result.user && result.user.profileImage ? result.user.profileImage : user.profileImage,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    originalValues = {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber: updatedUser.phoneNumber,
      gender: updatedUser.gender,
      profileImage: updatedUser.profileImage,
    };

    firstNameInput.value = updatedUser.firstName;
    lastNameInput.value = updatedUser.lastName;
    phoneInput.value = updatedUser.phoneNumber;
    genderInput.value = updatedUser.gender;
    imageInput.value = '';
    selectedImage = null;
    setPreview(updatedUser.profileImage || '');
    successMessage.style.display = 'block';
    updateCancelButton();
  } catch (error) {
    showError('เกิดข้อผิดพลาดในระบบ');
  }
});

applyValues(readUser());
