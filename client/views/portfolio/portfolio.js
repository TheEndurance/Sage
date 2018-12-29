import './portfolio.html';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

//methods
import { createPortfolio } from '../../../methods/portfolio.js';

/* #endregion */

/* #region portfolioForm */
/**
 * The portfolio form template that allows creation of new portfolios
 */

Template.portfolioForm.onCreated(function () {
    this.formState = new ReactiveDict();
    this.formState.setDefault({
        success: false,
        errors: {}
    })
});

Template.portfolioForm.helpers({
    isError(field) {
        const errors = Template.instance().formState.get('errors');
        return (errors[field] && errors[field].length > 0) ? 'error' : '';
    },
    errors(field) {
        const errors = Template.instance().formState.get('errors');
        return errors[field] != null ? errors[field] : [];
    },
    formState() {
        const { errors, success } = Template.instance().formState.all();
        let state = '';
        if (success === true) {
            state = 'success';
        } else if (Object.keys(errors).length > 0) {
            state = 'error'
        }
        return state;
    }
});

Template.portfolioForm.events({
    'submit #portfolioForm'(evt, tpl) {
        evt.preventDefault();
        const data = {
            name: evt.target.portfolioName.value,
            description: evt.target.description.value
        };

        createPortfolio.call(data, (err, res) => {
            if (err) {
                if (err.details) {
                    const errors = {
                        name: [],
                        description: []
                    };
                    err.details.forEach((fieldError) => {
                        errors[fieldError.name].push(fieldError.message);
                    });
                    tpl.formState.set({
                        success: false,
                        errors: errors
                    });
                } else if (err.reason) {
                    tpl.formState.set({
                        success: false,
                        errors: { custom: [err.reason] }
                    });
                }
            } else {
                tpl.formState.set({
                    success: true,
                    errors: {}
                });
                evt.target.reset();
            }
        })
    }
});
/* #endregion */