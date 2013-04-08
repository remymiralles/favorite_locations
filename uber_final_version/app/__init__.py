import flask
import flask.ext.sqlalchemy
import flask.ext.restless

from flask import Flask, flash, session, render_template, redirect, url_for
from flask.ext.sqlalchemy import SQLAlchemy


# debugging
from inspect import getmembers
from pprint import pprint

app = Flask(__name__)

app.config.from_object('config')


# initialize extensions.
db = SQLAlchemy(app)

# from app import models
from app import views, models


