"use strict"

class Form {
  constructor(formElement) {
    this.form = formElement;
    this.inputs = Array.from(document.querySelectorAll('input'));
    this.method = formElement.getAttribute('method');
    this.action = formElement.action;
  }

  validate() {
    this.inputs.forEach(input => {
      let errorText = "";
      if (input.validity.valueMissing) {
        errorText = `Please enter the ${input.getAttribute('id')} field`;
      } else if (input.validity.patternMismatch) {
        errorText = `Please enter a valid email`;
      }
      errorText && this.updateInputError(input, errorText);
    });
  }

  updateInputError(input, errorText) {
    input.nextElementSibling.textContent = errorText;
    input.classList.add('error');
    input.previousElementSibling.classList.add('error');
  }

  isvalid() {
    return this.form.checkValidity();
  }

  send() {
    return new Promise((resolve, reject) => {
      let data = new FormData(this.form);
      data = this.formDataToJSON(data);
      const xhr = new XMLHttpRequest();
      xhr.open(this.method, this.action);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = () => {
        if(xhr.status === 201) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject(xhr.repsonse);
        }
      }
      xhr.send(data);
    });
  }

  formDataToJSON(formData) {
    const json = {};
    for (var pair of formData.entries()) {
      json[pair[0]] = pair[1];
    }

    return JSON.stringify(json);
  }
}

class ContactsList {
  constructor(element, templates) {
    this.templates = templates;
    this.element = element;
  }

  load() {
    this.fetch()
        .then(contacts => {
          this.contacts = contacts;
          this.display();
        })
        .catch(response => console.error(response));
  }

  fetch() {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/contacts');
      xhr.responseType = 'json';
      xhr.onload = () => resolve(xhr.response);
      xhr.send();
    });
  }

  display() {
    const html = this.templates.contact_template({ contacts: this.contacts });
    this.element.innerHTML = html;
  }

  update(contact) {
    const contactLi = this.find(String(contact.id));
    contactLi ? this.alter(contactLi, contact) : this.add(contact);
  }

  alter(contactLi, contact) {
    const holder = document.createElement('div');
    holder.innerHTML = this.templates.contactPartial(contact);
    contactLi.parentNode.replaceChild(holder.firstElementChild, contactLi);
  }

  add(contact) {

  }

  remove(id) {
    this.delete(id)
      .then(() => {
        this.find(id).remove();
      })
      .catch(response => console.error(response));
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/api/contacts/' + id);
      xhr.onload = () => {
        if (xhr.status === 204) {
          resolve();
        } else if (xhr.status === 400) {
          reject(xhr.responseText);
        } 
      }
      xhr.send();
    });
  }

  find(id) {
    const contacts = this.element.querySelectorAll('li.contact');
    return Array.from(contacts).filter(contact => contact.getAttribute('data-id') === id)[0];
  }
}

class App {
  constructor() {
    this.contactsPage    = document.getElementById('contacts_page');
    this.addContactPage  = document.getElementById('add_contact_page');
    this.editContactPage = document.getElementById('edit_contact_page');
    this.addContactBtn   = document.getElementById('add_contact');
    this.addContactsForm = document.getElementById('add_contact_form');
    this.templates = this.createTemplates();
    this.registerPartials();
    this.contactsList = new ContactsList(document.getElementById('contacts_list'), this.templates);
    this.contactsList.load()
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
    document.onsubmit = this.handleFormSubmit.bind(this);
    document.onclick = this.handleClick.bind(this);
  }

  show(page) {
    const $visible = $('div.page:visible');
    $(page).appendTo($('main'));
    $(page).show();
    $visible.slideUp();
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const formElement = event.target;
    const form = new Form(formElement);
    form.validate();
    if (form.isvalid()) {
      form.send().then(contact => {
                    this.contactsList.update(contact);
                    this.show(this.contactsPage);
                  })
                 .catch(response => console.error(response));
    }
  }

  handleClick(event) {
    switch (event.target.textContent) {
      case "Cancel":
        this.show(this.contactsPage);
        break;
      case "Edit":
        this.renderEditForm(event.target.getAttribute('data-id'));
        break;
      case "Delete":
        this.contactsList.remove(event.target.getAttribute('data-id'));
        break;
    }
  }

  renderEditForm(id) {
    this.fetchContact(id).then(contact => {
      const html = this.templates.contact_form(contact);
      this.editContactPage.innerHTML = html;
      this.show(this.editContactPage);
    });
  }

  fetchContact(id) {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', "api/contacts/" + id);
      xhr.responseType = 'json';
      xhr.onload = () => resolve(xhr.response);
      xhr.send();
    });
  }

}

var app;
document.addEventListener('DOMContentLoaded', function() {
 app = new App;
});