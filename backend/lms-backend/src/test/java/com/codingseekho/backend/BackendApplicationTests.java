package com.codingseekho.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private CorsConfigurationSource corsConfigurationSource;

	@Test
	void contextLoads() {
	}

	@Test
	void allowsFrontendFromLocalNetwork() {
		MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/register");
		request.addHeader("Origin", "http://192.168.43.144:3000");
		CorsConfiguration configuration = corsConfigurationSource.getCorsConfiguration(request);

		assertEquals("http://192.168.43.144:3000",
				configuration.checkOrigin("http://192.168.43.144:3000"));
	}

}
