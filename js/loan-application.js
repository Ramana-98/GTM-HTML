(function ($) {
    var form = document.getElementById('loanApplicationForm');

    if (!form) {
        return;
    }

    var pageFields = {
        1: ['fullName', 'email', 'mobile', 'dob', 'gender'],
        2: ['employmentType', 'monthlyIncome', 'companyName', 'workExperience'],
        3: ['loanType', 'loanAmount', 'loanTenure', 'loanPurpose']
    };
    var storageKey = 'loanApplicationDraft';
    var currentStep = 1;
    var isTransitioning = false;

    form.reset();

    function saveDraft(step) {
        var values = {};
        form.querySelectorAll('[name]').forEach(function (field) {
            if (field.type === 'radio') {
                if (field.checked) {
                    values[field.name] = field.value;
                }
            } else {
                values[field.name] = field.value;
            }
        });

        try {
            window.sessionStorage.setItem(storageKey, JSON.stringify({ step: step, values: values }));
        } catch (error) {}
    }

    function restoreDraft() {
        var draft;
        try {
            draft = JSON.parse(window.sessionStorage.getItem(storageKey));
        } catch (error) {
            draft = null;
        }

        if (!draft || (draft.step !== 2 && draft.step !== 3) || !draft.values) {
            try {
                window.sessionStorage.removeItem(storageKey);
            } catch (error) {}
            return;
        }

        var previousStepFields = [];
        for (var stepNumber = 1; stepNumber < draft.step; stepNumber++) {
            previousStepFields = previousStepFields.concat(pageFields[stepNumber]);
        }

        Object.keys(draft.values).forEach(function (name) {
            if (previousStepFields.indexOf(name) === -1) {
                return;
            }

            var fields = form.querySelectorAll('[name="' + name + '"]');
            fields.forEach(function (field) {
                if (field.type === 'radio') {
                    field.checked = field.value === draft.values[name];
                } else {
                    field.value = draft.values[name];
                }
            });
        });
        showStep(draft.step);
        saveDraft(draft.step);
    }

    restoreDraft();

    function showStep(step) {
        currentStep = step;
        [1, 2, 3].forEach(function (stepNumber) {
            document.getElementById('loanStep' + stepNumber).hidden = stepNumber !== step;
        });
        document.getElementById('loanStep' + step + 'Title').focus();
    }

    function transitionToStep(step) {
        if (isTransitioning) {
            return;
        }

        saveDraft(step);
        isTransitioning = true;
        window.setTimeout(function () {
            showStep(step);
            isTransitioning = false;
        }, 300);
    }

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

    function validateCurrentStep() {
        var invalidField = null;
        var invalidName = '';

        pageFields[currentStep].some(function (fieldName) {
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
        if (currentStep > 1) {
            saveDraft(currentStep);
        }
    });

    $('#loanNextStep1').on('click', function () {
        if (validateCurrentStep()) {
            transitionToStep(2);
        }
    });

    $('#loanBackStep2').on('click', function () {
        transitionToStep(1);
    });

    $('#loanNextStep2').on('click', function () {
        if (validateCurrentStep()) {
            transitionToStep(3);
        }
    });

    $('#loanBackStep3').on('click', function () {
        transitionToStep(2);
    });

    $(form).on('submit', function (event) {
        event.preventDefault();
        if (validateCurrentStep()) {
            try {
                window.sessionStorage.removeItem(storageKey);
            } catch (error) {}
            $('#loanStep3').prop('hidden', true);
            $('#loanApplicationSuccess').prop('hidden', false).trigger('focus');
        }
    });
})(jQuery);