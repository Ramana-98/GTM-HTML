(function ($) {
    var form = document.getElementById('loanApplicationForm');

    if (!form) {
        return;
    }

    var page = document.body.getAttribute('data-loan-page');
    var pageFields = {
        personal: ['fullName', 'email', 'mobile', 'dob', 'gender'],
        employment: ['employmentType', 'monthlyIncome', 'companyName', 'workExperience'],
        loan: ['loanType', 'loanAmount', 'loanTenure', 'loanPurpose']
    };
    var nextButtons = {
        personal: { button: '#loanNextStep1', destination: 'employment-details.html' },
        employment: { button: '#loanNextStep2', destination: 'loan-details.html' }
    };
    function getErrorId(field) {
        return field.type === 'radio' ? field.name + 'Error' : field.id + 'Error';
    }

    function clearFieldError(field) {
        var error = document.getElementById(getErrorId(field));
        if (error) {
            error.hidden = true;
            error.textContent = '';
        }

        if (field.type === 'radio') {
            form.querySelectorAll('input[name="' + field.name + '"]').forEach(function (radio) {
                radio.classList.remove('loan-field-invalid');
            });
        } else {
            field.classList.remove('loan-field-invalid');
        }
    }

    function validateCurrentPage() {
        var invalidField = null;
        var invalidName = '';

        pageFields[page].some(function (fieldName) {
            if (fieldName === 'gender') {
                var genderSelected = form.querySelector('input[name="gender"]:checked');
                if (!genderSelected) {
                    invalidField = form.querySelector('input[name="gender"]');
                    invalidName = 'Gender';
                    return true;
                }
                return false;
            }

            var field = document.getElementById(fieldName);
            if (!field.checkValidity()) {
                invalidField = field;
                invalidName = field.getAttribute('placeholder') || field.getAttribute('aria-label');
                return true;
            }
            return false;
        });

        if (!invalidField) {
            return true;
        }

        var error = document.getElementById(getErrorId(invalidField));
        error.textContent = 'Please input your ' + invalidName + '.';
        error.hidden = false;

        if (invalidField.type === 'radio') {
            form.querySelectorAll('input[name="gender"]').forEach(function (radio) {
                radio.classList.add('loan-field-invalid');
            });
        } else {
            invalidField.classList.add('loan-field-invalid');
        }

        invalidField.focus();
        return false;
    }

    $(form).on('input change', 'input, select, textarea', function () {
        clearFieldError(this);
    });

    if (nextButtons[page]) {
        $(nextButtons[page].button).on('click', function () {
            if (validateCurrentPage()) {
                window.location.href = nextButtons[page].destination;
            }
        });
    }

    if (page === 'employment') {
        $('#loanBackStep2').on('click', function () {
            window.location.href = 'loan-application.html';
        });
    }

    if (page === 'loan') {
        $('#loanBackStep3').on('click', function () {
            window.location.href = 'employment-details.html';
        });

        $(form).on('submit', function (event) {
            event.preventDefault();
            if (validateCurrentPage()) {
                $('#loanStep3').prop('hidden', true);
                $('#loanApplicationSuccess').prop('hidden', false).trigger('focus');
            }
        });
    }
})(jQuery);