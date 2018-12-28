import './portfolio.html';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

//methods
import { createPortfolio } from '../../../methods/portfolio.js';

/* #endregion */

/* #region portfolioForm */
/**
 * The portfolio form template that allows creation of new portfolios
 */


 //ugly implentation of errors/success
 /**
  * Perhaps what I could instead is just one reactive dict variable 'state' that has
  * errors object or a success object
  * {
  *     name: ['error'],
  * }
  * vs
  * {
  *     success: true
  * }
  */

Template.portfolioForm.onCreated(function () {
    this.errors = new ReactiveDict();
    this.success = new ReactiveVar(false);
    this.autorun(() => {
        const success = Template.instance().success.get();
        if (success){
            this.errors.clear();
        }
    });
    this.autorun(()=>{
        const errors = Template.instance().errors.all();
        if (Object.keys(errors).length>0){
            this.success.set(false);
        }
    });
});

Template.portfolioForm.helpers({
    isError(field) {
        const errors = Template.instance().errors.get(field)
        return (errors != null && errors.length > 0) ? 'error' : '';
    },
    errors(field) {
        return Template.instance().errors.get(field);
    },
    formState() {
        const success = Template.instance().success.get();
        const errors = Template.instance().errors.all();
        let state = '';
        if (success) {
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
                console.log(err);
                if (err.details) {
                    const errors = {
                        name: [],
                        description: []
                    };
                    err.details.forEach((fieldError) => {
                        errors[fieldError.name].push(fieldError.message);
                    });
                    tpl.errors.set(errors);
                } else if (err.reason) {
                    tpl.errors.set({
                        custom: [err.reason]
                    });
                }
            } else {
                tpl.success.set(true)
            }
        })
    }
});
/* #endregion */