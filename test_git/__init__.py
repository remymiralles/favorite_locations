import os
import os.path

import flask
import flask.ext.sqlalchemy
import flask.ext.restless

from functools import wraps
from flask import Flask, flash, session, render_template, redirect, url_for
from flask.ext.login import current_user, login_user, LoginManager, UserMixin
from flask.ext.restless import APIManager, ProcessingException
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.security import login_required
from flask.ext.wtf import PasswordField, SubmitField, TextField, Form


#debugging
from inspect import getmembers
from pprint import pprint

# the database in this example is at './test.sqlite'.
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        '/tmp/uber.db')

if os.path.exists(DATABASE):
    os.unlink(DATABASE)



# Create the Flask application and the Flask-SQLAlchemy object.
app = Flask(__name__)
app.config['DEBUG'] = True
app.config['TESTING'] = True
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///%s' % DATABASE

# initialize extensions.
db = SQLAlchemy(app)
api_manager = APIManager(app, flask_sqlalchemy_db=db)
login_manager = LoginManager()
login_manager.setup_app(app)



# Create your Flask-SQLALchemy models as usual but with the following two
# (reasonable) restrictions:
#   1. They must have an id column of type Integer.
#   2. They must have an __init__ method which accepts keyword arguments for
#      all columns (the constructor in flask.ext.sqlalchemy.SQLAlchemy.Model
#      supplies such a method, so you don't need to declare a new one).
# class Person(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.Unicode, unique=True)
#     birth_date = db.Column(db.Date)

# create the user database model.
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Unicode)
    password = db.Column(db.Unicode)    

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode)
    address = db.Column(db.Unicode)    
    lat =db.Column(db.Float)
    long =db.Column(db.Float)
    ownerid = db.Column(db.Integer, db.ForeignKey('user.id'))
    owner = db.relationship('User', backref=db.backref('locations',
                                                         lazy='dynamic'))    	


#create the database and add a test user.
db.create_all()
user1 = User(username=u'example', password=u'example')
db.session.add(user1)
db.session.commit()

user2 = User(username=u'remy', password=u'test')
db.session.add(user2)
db.session.commit()

#this is required for Flask-Login.
@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)

#create the login form.
class LoginForm(Form):
    username = TextField('Username')
    password = PasswordField('Password')
    submit = SubmitField('Login')

def login_required(test):
    @wraps(test)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return test(*args, **kwargs)
        else:
            flash('You need to login first.')
            return redirect(url_for('login'))
    return wrap 



#create endpoints for the application, one for index and one for login
@app.route('/', methods=['GET'])
@login_required
def index():
    # app.logger.debug(matches[0].get_id())
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username, password = form.username.data, form.password.data
        matches = User.query.filter_by(username=username,
                                       password=password).all()
        if len(matches) > 0:
            login_user(matches[0])
            # app.logger.debug(matches[0].get_id())
            # app.logger.debug(dump(matches[0]))

            session['logged_in'] = True
            # session['user_id'] = matches[0].get_id()
            return redirect(url_for('index'))

        flash('Username and password pair not found')
    return render_template('login.html', form=form)

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

# start the flask loop
app.run()
