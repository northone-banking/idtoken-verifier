var expect = require('expect.js');

var CacheMock = require('./mock/cache-mock');
var helpers = require('./helper/token-validation');
var rewire = require('rewire');
var sinon = require('sinon');

var error = require('../src/helpers/error');
var IdTokenVerifier = rewire('../src/index');

describe('jwt-verification', function () {

  it('should verify the signature using the public key in the cache', function (done) {
    helpers.assertTokenValid(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience,
        __disableExpirationCheck: true,
        jwksCache: CacheMock.validKey()
      },
      helpers.validNonce,
      null,
      null,
      done
    )
  });

  it('should fetch the public key and verify the token', function (done) {
    helpers.assertTokenValid(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience,
        __disableExpirationCheck: true
      },
      helpers.validNonce,
      null,
      null,
      done
    )
  });

  it('should allow multiple audiences in the token', function (done) {
    helpers.assertTokenValid(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience,
        __disableExpirationCheck: true,
        jwksCache: CacheMock.setKey('d33cd8bf0bf355936f01a5ddd5a5b9b8614165af4acd24334a9127bf2bb4b839849ca1dda20be4a32120f600daa9ee3db24ed14314430f167120ee8a9dee9d405233b8c06b2f12c1589427bfc789a38e33863ed3aed614a93dc9dc19d060aa03ef455355c92c1882cc6efb8ff1db37308492e53930244d6fef0a407685d0af259c4f92b4c489a4de3c07371d7bbe5326dd49ed7c58bf79c0633c623a5409a228094aca8fdcc711bf387beae9eacad44a0355724562a79db7d034ac8f576b267dcac2925a1fec0f542d984e9353ce1a31832e6622a2f11ee6d33493ca4682c25ce3655da638fec0b80b99d9c70e8096f8c62d6497b179d3b1b10cbecbe3a99865')
      },
      helpers.validNonce,
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjpbImdZU05sVTRZQzRWMVlQZHFxOHpQUWN1cDZySncxTWJ0Iiwic2Vjb25kQXVkaWVuY2UiXSwiZXhwIjoxNDgyOTY5MDMxLCJpYXQiOjE0ODI5MzMwMzEsIm5vbmNlIjoiYXNmZCJ9.k0xA4cK2UyEkpZygscUGqgAOTGWoBJQkdzpjF5iB0mXxOPv8Hd0fGJT0XSqA9zIdsDpDJUCA5xz1Fz7D9fLVS0AzzkNwFdH3yTNp6SMbMGwZ6kmJ9XM-RgpvJsZTLZyVCFH0hJ_uq4OLajHZ9mLdpA9nn7n7n7T6IOsAqMM9z10Ctoz1W8ARyZlV0TAbGt4VkWX6s-48XjrkhR6kOVIekzyaFmPimp-CiHvIQaeC_v6_mhJoG-deCzRhd521kf1zL5H-o29r4NVpsCyIWgWqIGfMhzmI-apoWDah_aJLoppizpgnFwGSmoQ2vt2wfKCJkb2cxzlkYguCTpf7ru706g',
      {
        iss: helpers.validIssuer,
        sub: helpers.validSub,
        aud: [helpers.validAudience, 'secondAudience'],
        exp: 1482969031,
        iat: 1482933031,
        nonce: helpers.validNonce
      },
      done);
  });

  it('should FAIL to verify the signature using the public key', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience,
        __disableExpirationCheck: true,
        jwksCache: CacheMock.invalidKey()
      },
      helpers.validNonce,
      'Invalid signature.',
      null,
      done
    );
  });

  it('should fail if the leeway is too big', function (done) {
    helpers.assertValidatorInitalizationError(
      {
        leeway: 100
      },
      'The leeway should be positive and lower than a minute.',
      done
    );
  });

  it('should fail if the leeway is negative', function (done) {
    helpers.assertValidatorInitalizationError(
      {
        leeway: -1
      },
      'The leeway should be positive and lower than a minute.',
      done
    );
  });

  it('should fail if the algorithm is not supported', function (done) {
    helpers.assertValidatorInitalizationError(
      {
        expectedAlg: 'HS256'
      },
      'Algorithm HS256 is not supported. (Expected algs: [RS256])',
      done
    );
  });

  it('should fail if the nonce does not match', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience,
        __disableExpirationCheck: true,
        jwksCache: CacheMock.validKey()
      },
      'invalid',
      'Nonce does not match.',
      null,
      done
    );
  });

  it('should fail if the token is not valid', function (done) {
    helpers.assertTokenValidationError(
      {},
      null,
      'Cannot decode a malformed JWT',
      'asjkdhfgakdsjhf',
      done
    );
  });

  it('should require to whitelist the iss', function (done) {
    helpers.assertTokenValidationError(
      {},
      helpers.validNonce,
      'Issuer https://wptest.auth0.com/ is not valid.',
      null,
      done
    );
  });

  it('should require to whitelist the audience', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer
      },
      helpers.validNonce,
      'Audience gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt is not valid.',
      null,
      done
    );
  });

  it('should require to whitelist at least one audience when the are multiple in the token', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: 'unknown',
        __disableExpirationCheck: true,
        jwksCache: CacheMock.setKey('d33cd8bf0bf355936f01a5ddd5a5b9b8614165af4acd24334a9127bf2bb4b839849ca1dda20be4a32120f600daa9ee3db24ed14314430f167120ee8a9dee9d405233b8c06b2f12c1589427bfc789a38e33863ed3aed614a93dc9dc19d060aa03ef455355c92c1882cc6efb8ff1db37308492e53930244d6fef0a407685d0af259c4f92b4c489a4de3c07371d7bbe5326dd49ed7c58bf79c0633c623a5409a228094aca8fdcc711bf387beae9eacad44a0355724562a79db7d034ac8f576b267dcac2925a1fec0f542d984e9353ce1a31832e6622a2f11ee6d33493ca4682c25ce3655da638fec0b80b99d9c70e8096f8c62d6497b179d3b1b10cbecbe3a99865')
      },
      helpers.validNonce,
      'Audience gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt,secondAudience is not valid.',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjpbImdZU05sVTRZQzRWMVlQZHFxOHpQUWN1cDZySncxTWJ0Iiwic2Vjb25kQXVkaWVuY2UiXSwiZXhwIjoxNDgyOTY5MDMxLCJpYXQiOjE0ODI5MzMwMzEsIm5vbmNlIjoiYXNmZCJ9.k0xA4cK2UyEkpZygscUGqgAOTGWoBJQkdzpjF5iB0mXxOPv8Hd0fGJT0XSqA9zIdsDpDJUCA5xz1Fz7D9fLVS0AzzkNwFdH3yTNp6SMbMGwZ6kmJ9XM-RgpvJsZTLZyVCFH0hJ_uq4OLajHZ9mLdpA9nn7n7n7T6IOsAqMM9z10Ctoz1W8ARyZlV0TAbGt4VkWX6s-48XjrkhR6kOVIekzyaFmPimp-CiHvIQaeC_v6_mhJoG-deCzRhd521kf1zL5H-o29r4NVpsCyIWgWqIGfMhzmI-apoWDah_aJLoppizpgnFwGSmoQ2vt2wfKCJkb2cxzlkYguCTpf7ru706g',
      done
    );
  });

  it('should check the token expiration', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience
      },
      helpers.validNonce,
      'Expired token.',
      null,
      done
    );
  });

  it('should fail if the token alg is not the one expected', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience
      },
      helpers.validNonce,
      'Algorithm HS256 is not supported. (Expected algs: [RS256])',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
      done
    );
  });

  it('should fail with missing claims', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience
      },
      helpers.validNonce,
      'Issuer undefined is not valid.',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
      done
    );
  });

  it('should fail with corrupt token', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience
      },
      helpers.validNonce,
      'Invalid signature.',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjk0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
      done
    );
  });

  it('should validate the nbf claim', function (done) {
    helpers.assertTokenValidationError(
      {
        issuer: helpers.validIssuer,
        audience: helpers.validAudience
      },
      helpers.validNonce,
      'The token is not valid until later in the future. Please check your computed clock.',
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJub25jZSI6ImFzZmQiLCJpYXQiOjE0OTczNjQyNzMsIm5iZiI6NDY1MzEyNDI3MywiZXhwIjo3ODA4ODg0MjczfQ.IWU4y_Q2jHOmOR50Kk64oYIa1scvRMxzOE7sly_R953eypSoHB1OEWROsG4-qsTStfaJ7c6LbxeCbzpiFMAXDr594vDXny2lb8W_mF8OoTBPxMMlSBisy60hcH_GJL864SNiijr4SEuPL5sAUAI4PL77FrMpVODZ_To9GwixkZ8ajN7E7CYwlK6xkUuq5PQOknNjc1KBFh5bwIuA5gRSi0ggp74pi3bR9MRGLxMvZx_7kxa6G2IeTcXYjBlDS8BnKpoW0d6vOK804DWA8OIYTTY8570FaOwxusxEK-D8LolA8v7JfYY2AvWkjXwxN9rtGlMjZrXiUMAk67eW8abGWw',
      done
    );
  });

  it('should decode the token', function () {
    var id_token = helpers.validToken;
    var verifier = new IdTokenVerifier();
    var result = verifier.decode(id_token);

    expect(result).to.eql({
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: 'QzE4N0ZBM0VDQzE2RUU0NzI1QzY1MzQ4QTk1MzAwMEI4RDgxNzE4Rg'
      },
      payload: {
        iss: helpers.validIssuer,
        sub: helpers.validSub,
        aud: helpers.validAudience,
        exp: 1482969031,
        iat: 1482933031,
        nonce: helpers.validNonce
      },
      encoded: {
        header: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9',
        payload: 'eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0',
        signature: 'PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
      }
    });
  });

  it('should return an error when trying to decode (not verify) a malformed token', function () {
    var id_token = 'this.is.not.a.jwt';
    var verifier = new IdTokenVerifier();
    var result = verifier.decode(id_token);
    expect(result).to.be.an(error.TokenValidationError);
    expect(result.message).to.eql('Cannot decode a malformed JWT');
  });

  it('should return an error when trying to decode (not verify) a token with invalid JSON contents', function () {
    var id_token = 'invalid.json.here';
    var verifier = new IdTokenVerifier();
    var result = verifier.decode(id_token);
    expect(result).to.be.an(error.TokenValidationError);
    expect(result.message).to.eql('Token header or payload is not valid JSON');
  });
  
  describe('getRsaVerifier', function () {
    it('should pass options.jwksURI through ', function(done){
      var mockJwks = {
          getJWKS: function(options){
            expect(options.jwksURI).to.be('https://example.com/');
            done();
          }
      };
      var revert = IdTokenVerifier.__set__({jwks: mockJwks});
      
      var verifier = new IdTokenVerifier({jwksURI: 'https://example.com/'});
      verifier.getRsaVerifier('iss', 'kid');
      revert();
    });
    it('should call callback once with error when an error is returned from jwks.getJWKS', function(){
      var mockJwks = {
          getJWKS: function(){}
      };
      var err = 'error';
      sinon.stub(mockJwks, 'getJWKS', function(obj, cb) {
        cb(err);
      });
      
      var revert = IdTokenVerifier.__set__({jwks: mockJwks});
      
      var callback = sinon.spy();
      
      var verifier = new IdTokenVerifier({jwksCache: CacheMock.validKey()});
      verifier.getRsaVerifier('iss', 'kid', callback);
      
      try {
        sinon.assert.calledOnce(callback);      
        expect(callback.calledWith(err)).to.be.ok();
      }
      finally {
        revert();
      }
    });
  });
});
describe('access_token validation', function() {
  describe('With empty access_tokens', function() {
    [null, undefined, ''].forEach(function(at) {
      it('should throw when access_token is `' + at + '`', function(done) {
        var access_token = at;
        var alg = 'RS256';
        var at_hash = 'at_hash';
    
        var itv = new IdTokenVerifier();
        itv.validateAccessToken(access_token, alg, at_hash, function(err) {
          expect(err.name).to.be('TokenValidationError');
          expect(err.message).to.be('Invalid access_token');
          done();
        });
      });
    });
  });
  it('should throw an error with HS256 id_token', function(done) {
    var access_token = "YTvJYcYrrZYHUXLZK5leLnfmD5ZIA_EA";
    var alg = 'HS256';
    var at_hash = 'at_hash';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err.name).to.be('TokenValidationError');
      expect(err.message).to.be('Algorithm HS256 is not supported. (Expected alg: RS256)');
      done();
    });
  });
  it('should throw an error when access_token is invalid', function(done) {
    var access_token = "not an access token";
    var alg = 'RS256';
    var at_hash = 'cdukoaUswM9bo_yzrgVcrw';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err.name).to.be('TokenValidationError');
      expect(err.message).to.be('Invalid access_token');
      done();
    });
  });
  it('should validate access_token with RS256 id_token', function(done) {
    var access_token = "YTvJYcYrrZYHUXLZK5leLnfmD5ZIA_EA";
    var alg = 'RS256';
    var at_hash = 'cdukoaUswM9bo_yzrgVcrw';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err).to.be(null);
      done();
    });
  });
});
