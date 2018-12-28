import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Portfolios } from '../collections/Portfolios.js'


export const createPortfolio = new ValidatedMethod({
    name: 'Portfolios.create',
    validate: new SimpleSchema({
        name: { type: String, min: 1 },
        description: { type: String, optional: true }
    }).validator(),
    run(newPortfolio) {
        const portfolio = Portfolios.findOne({ name: newPortfolio.name });
        if (portfolio) {
            throw new Meteor.Error('Portfolios.create.already-exists', 'A portfolio with that name already exists');
        }

        Portfolios.insert(newPortfolio)
    }
})

// This Method encodes the form validation requirements.
// By defining them in the Method, we do client and server-side
// validation in one place.
// export const insert = new ValidatedMethod({
//   name: 'Invoices.methods.insert',
//   validate: new SimpleSchema({
//     email: { type: String, regEx: SimpleSchema.RegEx.Email },
//     description: { type: String, min: 5 },
//     amount: { type: String, regEx: /^\d*\.(\d\d)?$/ }
//   }).validator(),
//   run(newInvoice) {
//     // In here, we can be sure that the newInvoice argument is
//     // validated.

//     if (!this.userId) {
//       throw new Meteor.Error('Invoices.methods.insert.not-logged-in',
//         'Must be logged in to create an invoice.');
//     }

//     Invoices.insert(newInvoice)
//   }
// });



// <template name="Invoices_newInvoice">
//   <form class="Invoices_newInvoice">
//     <label for="email">Recipient email</label>
//     <input type="email" name="email" />
//     {{#each error in errors "email"}}
//       <div class="form-error">{{error}}</div>
//     {{/each}}

//     <label for="description">Item description</label>
//     <input type="text" name="description" />
//     {{#each error in errors "description"}}
//       <div class="form-error">{{error}}</div>
//     {{/each}}

//     <label for="amount">Amount owed</label>
//     <input type="text" name="amount" />
//     {{#each error in errors "amount"}}
//       <div class="form-error">{{error}}</div>
//     {{/each}}
//   </form>
// </template>



// import { insert } from '../api/invoices/methods.js';

// Template.Invoices_newInvoice.onCreated(function() {
//   this.errors = new ReactiveDict();
// });

// Template.Invoices_newInvoice.helpers({
//   errors(fieldName) {
//     return Template.instance().errors.get(fieldName);
//   }
// });

// Template.Invoices_newInvoice.events({
//   'submit .Invoices_newInvoice'(event, instance) {
//     const data = {
//       email: event.target.email.value,
//       description: event.target.description.value,
//       amount: event.target.amount.value
//     };

//     insert.call(data, (err, res) => {
//       if (err) {
//         if (err.error === 'validation-error') {
//           // Initialize error object
//           const errors = {
//             email: [],
//             description: [],
//             amount: []
//           };

//           // Go through validation errors returned from Method
//           err.details.forEach((fieldError) => {
//             // XXX i18n
//             errors[fieldError.name].push(fieldError.type);
//           });

//           // Update ReactiveDict, errors will show up in the UI
//           instance.errors.set(errors);
//         }
//       }
//     });
//   }
// });