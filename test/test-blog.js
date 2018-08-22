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

function generateBlogPostData() { 
	return {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.lorem.sentence(),
		content: faker.lorem.text()
	}
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Blog posts API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
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
					expect(res.body).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					expect(res.body).to.have.lengthOf(count);
				});
		});

		it('should return blogs with right fields', function() {

			let resPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.lengthOf.at.least(1);

					res.body.posts.forEach(function(post) {
						expect(post).to.be.a('object');
						expect(post).t.include.keys(
							'id', 'title', 'content', 'author', 'created');
					});
					resPost = res.body.posts[0];
					return BlogPost.findById(resPost.id);
				})				.then(function(post) {
					expect(resPost.id).to.equal(post.id);
					expect(resPost.title).to.equal(post.title);
					expect(resPost.content).to.equal(post.content);
					expect(resPost.author.firstName).to.equal(post.author.firstName);
					expect(resPost.author.lastName).to.equal(post.author.lastName);
					expect(resPost.created).to.equal(post.created);
				});
		});
	});
	describe('POST endpoint', function() {
		it('should add a new post', function() {

			const newPost = generateBlogPostData();

			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.include.keys(
						'id', 'title', 'content', 'author', 'created');
					expect(res.body.title).to.equal(newPost.title);
					expect(res.body.author).to.equal(newPost.author);
					expect(res.body.content).to.equal(newPost.content);
					return BlogPost.findById(res.body.id);
				})
				.then(function(posts) {
					expect(resPosts.id).to.equal(posts.id);
					expect(resPosts.title).to.equal(posts.title);
					expect(resPosts.content).to.equal(posts.content);
					expect(resPosts.author).to.equal(posts.author);
					expect(resPosts.created).to.equal(posts.created);
				});
		});
	});
	describe('PUT endpoint', function() {
		it('should update fields', function() {
			const updateData  = {
				title: 'something',
				content: 'stuff',
				author: {
					firstName: 'somebody',
					lastName: 'anybody'
				}
			};

			return BlogPost
				.findOne()
				.then(function(post) {
					updateData.id = post.id;
					return chai.request(app)
						.put(`/posts/${post.id}`)
						.send(updateData)
				})
				.then(function(res) {
					expect(res).to.have.status(204);

					return BlogPost.findById(updateData.id);
				})
				.then(function(post) {
					expect(post.title).to.equal(updateData.title);
					expect(post.author.firstName).to.equal(updateData.author.firstName);
					expect(post.author.lastName).to.equal(updateData.author.lastName)
					expect(post.content).to.equal(updateData.content);
				});
		});
	});
	describe('DELETE endpoint', function() {
		it('should delete blog by id', function() {
			let blogs;

			return BlogPost
				.findOne()
				.then(function(_blogs) {
					blogs = _blogs;
					return chai.request(app).delete(`/posts/${blogs.id}`);
				})
				.then(function(res) {
					expect(res).to.have.status(204);
					return BlogPost.findById(blogs.id);
				})
				.then(function(_blogs) {
					expect(_blogs).to.be.null;
				});
		});
	});
});