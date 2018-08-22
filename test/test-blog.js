'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose')

const expect = chai.expect;

const { BlogPost } = require('../models');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
	console.info('seeding blog data');
	const seedData = [];

	for(let i = 1; i <= 10; i++) {
		seedData.push(generateBlogPostData());
	}
	return BlogPost.insertMany(seedData);
}

generateBlogPostData() {
	return {
		author: {
			firstName: faker.firstName(),
			lastName: faker.lastName()
		},
		title: faker.lorem.sentence(),
		content: faker.lorem.text()
}

function tearDownDb() {
	console.warn('Deleting databse');
	return mongoose.connection.dropDatabse();
}

describe('Blog posts API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEache(function() {
		return seedBlogPostData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {
		it('should return all existing blog posts', function() {
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body.posts).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					expect(res.body.posts).to.have.lengthOf(count);
				});
		});

		it('should return blogs with right fields', function() {

			let resPosts;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.have.be.json;
					expect(res.body.posts).to.be.a('array');
					expect(res.body.posts).to.have.lengthOf.at.least.(1);

					res.body.posts.forEach(function(posts) {
						expect(posts).to.be.a.('object');
						expect(posts).t.include.keys(
							'id', 'title', 'content', 'author', 'created');
					});
					resPosts = res.body.posts[0];
					return BlogPost.findById(resPosts.id);
				});
				.then(function(posts) {
					expect(resPosts.id).to.equal(posts.id);
					expect(resPosts.title).to.equal(posts.title);
					expect(resPosts.content).to.equal(posts.content);
					expect(resPosts.author).to.equal(posts.author);
					expect(resPosts.created).to.equal(posts.created);
				});
		});
	});
	describe('POST endpoint', function() {
		
	})
});