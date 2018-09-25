"use strict"

class FormValidator {
  constructor
}

class App {
  constructor() {
    this.addContactBtn = document.getElementById('add_contact');
    this.addContactPage = document.getElementById('add_contact_page');
    this.addContactsForm = document.getElementById('add_contact_form');
    this.templates = this.createTemplates();
    this.registerPartials();
    this.bind();
  }

  createTemplates() {
    const templates = {};
    const sources = document.querySelectorAll('script[type="text/x-handlebars"]');
    Array.from(sources).forEach(source => {
      templates[source.getAttribute('id')] = Handlebars.compile(source.innerHTML);
    });
    return templates;
  }

  registerPartials() {
    const sources = document.querySelectorAll('script[data-type="partial"]');
    Array.from(sources).forEach(source => {
      Handlebars.registerPartial(source.getAttribute('id'), source.innerHTML)});
  }

  bind() {
    this.addContactBtn.onclick = this.show.bind(this, this.addContactPage);
    this.addContactsForm.onsubmit = this.handleFormSubmit.bind(this, this.addContactsForm);
  }

  show(page) {
    const $visible = $('div.page:visible');
    $(page).appendTo($('main'));
    $(page).show();
    $visible.slideUp();
  }

  handleFormSubmit(event, form) {
    event.preventDefault();
    const validator = new FormValidator(form);
    validator.check();
    if (validator.notValid()) { return }
    const formData = new formData(this.addContactsForm);
    const xhr = new XMLHttpRequest();
    xhr.open(form.method, form.action);
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
    xhr.onload = () => this.resetContacts();
    }
    xhr.send(formData)
  }

  resetContacts() {

  }
}

document.addEventListener('DOMContentLoaded', function() {
  new App;
});