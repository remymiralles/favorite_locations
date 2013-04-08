import flask
import flask.ext.sqlalchemy
import flask.ext.restless

from functools import wraps
from flask import render_template, flash, redirect
from app import app
from flask.ext.wtf import PasswordField, SubmitField, TextField, Form
from flask.ext.security import login_required
from flask import Flask, flash, session, render_template, redirect, url_for
from flask.ext.login import current_user, login_user, LoginManager, UserMixin
from flask.ext.restless import APIManager, ProcessingException

from app import db
from models import User, Location

api_manager = APIManager(app, flask_sqlalchemy_db=db)
login_manager = LoginManager()
login_manager.setup_app(app)


# this is required for Flask-Login.
@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)

# create the login form.
class LoginForm(Form):
    username = TextField('Username')
    password = PasswordField('Password')
    submit = SubmitField('Login')

#Some entry points  need to make sure the user is logged in
def login_required(test):
    @wraps(test)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return test(*args, **kwargs)
        else:
            flash('You need to login first.')
            return redirect(url_for('login'))
    return wrap 



# create endpoints for the application for index
@app.route('/', methods=['GET'])
@login_required
def index():
    # app.logger.debug(matches[0].get_id())
    return render_template('index.html')

# create endpoints for the application for login
@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username, password = form.username.data, form.password.data
        matches = User.query.filter_by(username=username,
                                       password=password).all()
        if len(matches) > 0:
            login_user(matches[0])
            session['logged_in'] = True
            return redirect(url_for('index'))

        flash('Username and password pair not found')
    return render_template('login.html', form=form)

# create endpoints for the application for logout
@app.route('/logout')
@login_required
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('login'))

# create the API for User with the authentication guard.
def auth_func(params):
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not authenticated!')
    return params

# Create API endpoints, which will be available at /api/<tablename> by
# default. Allowed HTTP methods can be specified as well.
# api_manager.create_api(User, preprocessors=dict(GET_SINGLE=[auth_func],
api_manager.create_api(User, methods=['GET', 'POST', 'DELETE'], preprocessors=dict(GET_SINGLE=[auth_func], GET_MANY=[auth_func]))
api_manager.create_api(Location, methods=['GET', 'POST', 'DELETE', 'PUT', 'PATCH'], preprocessors=dict(GET_SINGLE=[auth_func], GET_MANY=[auth_func]))
