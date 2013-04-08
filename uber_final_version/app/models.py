from app import db
from flask.ext.login import UserMixin

#user table
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Unicode)
    password = db.Column(db.Unicode)    


#location table
class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Unicode)
    address = db.Column(db.Unicode)    
    lat =db.Column(db.Float)
    long =db.Column(db.Float)
    ownerid = db.Column(db.Integer, db.ForeignKey('user.id'))
    owner = db.relationship('User', backref=db.backref('locations',
                                                         lazy='dynamic'))       

