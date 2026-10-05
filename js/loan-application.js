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
    var reloadStepKey = 'loanApplicationReloadStep';
    var currentStep = 1;
    var isTransitioning = false;

    function isPageReload() {
        var entries = window.performance.getEntriesByType('navigation');
        return entries.length > 0 && entries[0].type === 'reload';
    }

    function showStep(step) {
        currentStep = step;
        [1, 2, 3].forEach(function (stepNumber) {
            document.getElementById('loanStep' + stepNumber).hidden = stepNumber !== step;
        });
        document.getElementById('loanStep' + step + 'Title').focus();
    }

    function clearStepFields(step) {
        pageFields[step].forEach(function (fieldName) {
            form.querySelectorAll('[name="' + fieldName + '"]').forEach(function (field) {
                if (field.type === 'radio') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
            });
        });
    }

    function saveReloadValues(step) {
        var values = {};

        for (var stepNumber = 1; stepNumber < step; stepNumber++) {
            pageFields[stepNumber].forEach(function (fieldName) {
                form.querySelectorAll('[name="' + fieldName + '"]').forEach(function (field) {
                    if (field.type === 'radio') {
                        if (field.checked) {
                            values[field.name] = field.value;
                        }
                    } else {
                        values[field.name] = field.value;
                    }
                });
            });
        }

        var state = window.history.state;
        if (!state || typeof state !== 'object') {
            state = {};
        }
        state.loanApplicationReload = { step: step, values: values };
        window.history.replaceState(state, '');
    }

    function restoreReloadValues(values, step) {
        if (!values) {
            return;
        }

        for (var stepNumber = 1; stepNumber < step; stepNumber++) {
            pageFields[stepNumber].forEach(function (fieldName) {
                if (!Object.prototype.hasOwnProperty.call(values, fieldName)) {
                    return;
                }

                form.querySelectorAll('[name="' + fieldName + '"]').forEach(function (field) {
                    if (field.type === 'radio') {
                        field.checked = field.value === values[fieldName];
                    } else {
                        field.value = values[fieldName];
                    }
                });
            });
        }
    }

    function restoreReloadStep() {
        var step = null;
        var reloadState = null;

        try {
            if (isPageReload()) {
                step = Number(window.sessionStorage.getItem(reloadStepKey));
                var currentHistoryState = window.history.state;
                reloadState = currentHistoryState && currentHistoryState.loanApplicationReload;
            }
            window.sessionStorage.removeItem(reloadStepKey);
            window.sessionStorage.removeItem('loanApplicationDraft');

            var historyState = window.history.state;
            if (historyState && typeof historyState === 'object' && historyState.loanApplicationReload) {
                delete historyState.loanApplicationReload;
                window.history.replaceState(historyState, '');
            }
        } catch (error) {
            console.error('Unable to read or clear loan application reload state.', error);
        }

        if (step !== 2 && step !== 3) {
            form.reset();
            return;
        }

        if (reloadState && reloadState.step === step) {
            restoreReloadValues(reloadState.values, step);
        }
        clearStepFields(step);
        if (step === 2) {
            clearStepFields(3);
        }
        showStep(step);
    }

    window.addEventListener('pagehide', function () {
        var visibleStep = [1, 2, 3].filter(function (step) {
            return !document.getElementById('loanStep' + step).hidden;
        })[0];

        try {
            if (visibleStep) {
                window.sessionStorage.setItem(reloadStepKey, String(visibleStep));
            } else {
                window.sessionStorage.removeItem(reloadStepKey);
            }
        } catch (error) {
            console.error('Unable to save the visible loan application step for reload.', error);
        }
    });

    window.addEventListener('pageshow', restoreReloadStep);

    function transitionToStep(step) {
        if (isTransitioning) {
            return;
        }

        saveReloadValues(step);
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
            $('#loanStep3').prop('hidden', true);
            $('#loanApplicationSuccess').prop('hidden', false).trigger('focus');
        }
    });
})(jQuery);