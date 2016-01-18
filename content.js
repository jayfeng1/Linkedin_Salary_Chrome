/*
Algorithm:
	Look at years of relevant experience by searching up job title
	Make multiple ajax requests to get salaries to calculate increases in pay
	Note in database if requests to h1data for certain company returns 0
	Save request and company info into mongodb database and query it first
	POSITION SEARCH: If it's more than two words, find the two longest words and search
		- exclude software engineer from this list
	NOTES: Replace intern and do a direct glassdoor search

	PRIORITY: Jquery and find each job title

TODO:
					Jquery grab education year - Done
	Estimate salary on index based on years after graduation
	Grab headline position if current one doesn't show results
					Scrape Indeed's salary - Done
	Scrape all past experience to get a better estimate of current's salary
	Glassdoor database
	Insert URL into linkedin profile
	Kimonolabs integration with glassdoor

BUGS:
	- Incognito - title selector changes to "learn more about this position"
*/

var cities = 	['seattle', 'san francisco', 'los angeles', 'new york', 'chicago',
				'atlanta', 'portland', 'austin', 'denver', 'philadelphia', 'miami',
				'orlando', 'houston', 'dallas', 'washington', 'san jose', 'venice', 
				'austin']
var title_change = {
	'sr': 'senior',
	'jr': 'junior'
}

$(document).ready(function() {
	var data = [];
	var company;
	var position;
	var posit;
	var comp;
	//Return salary info for one position only
	var i = 0;

	/**
	 * Check if current-position or past-position exists
	 * If it does, push position, company, and city into array
	**/
	$("div.editable-item.section-item.current-position").each(function(i) {
		data.push({
			'position' : $(this).find("h4").find("a[title='Learn more about this title']").text(),
			'company' : $(this).find("h5").find("a[dir='auto']").text(),
			'city' : $(this).find("span[class='locality']").text()
		});
	});
	$("div.editable-item.section-item.past-position").each(function(i) {
		data.push({
			'position' : $(this).find("h4").find("a[title='Learn more about this title']").text(),
			'company' : $(this).find("h5").find("a[dir='auto']").text(),
			'city' : $(this).find("span[class='locality']").text()
		});
	});

	//Find year of graduation
	var edu_years = $("span.education-date").find("time").text();
	var locality = $("span.locality").find("a").text()

	//Change city to header city if position doesn't list it
	if (data[i].city.length < 1) {
		data[i].city = locality
	}

	//Create a url to scrape from h1bdata.info given their current position 
	h1b_url = get_h1b_url(data[i]).h1b_url;
	//TODO: Find if that job exists in indeed
	var job_url = 'https://www.indeed.com/jobs?q=title%3A"' + posit + 
		'"+company%3A' + comp;
	//Scrape the salary and paste if relevant
	scrape_h1b(check_salary, h1b_url);

	/**
	 * ALL OF THE FUNCTIONS
	**/

	// Takes in the linkedin company name and reformats for url search
	function format_company(company_name) {
		if(company_name.split(' ').length > 2) {
			return company_name.split(' ')[0];
		} else {
			return format_url(company_name);
		}	
	}

	/* This function takes in their current experience json and outputs the corresponding
		h1b data url to scrape
	*/
	function get_h1b_url(job) {
		posit = format_url(job.position.split(',')[0]);
		comp = format_company(job.company)
		job.h1b_url = 'http://h1bdata.info/index.php?em=' + comp + '&job=' 
		+ posit + '&city=&year=All';
		return job
	}

	// Split a string
	function format_url(word) {
		return word.split(/[\s,]+/).join('+')
	}

	// Scrape the url and then run the designated callback function on the response
	function scrape_h1b(callback, url) {
		chrome.runtime.sendMessage({
		    method: 'GET',
		    action: 'xhttp',
		    url: url,
		    data: 'q=something',
		}, function(response) {
				callback(response);
		});
	}
	
	// TODO: Grab median salary from the top of H1B database
	function check_salary(responseText) {
		var salaries = [];
		if ($(responseText).find("tr").length > 1) {
			$(responseText).find("tr").each(function() {
				salaries.push($(this).children("td:nth-child(3)").text());
			})
			var salary = salaries[Math.floor(salaries.length/2)]
			console.log(salaries[Math.floor(salaries.length/2)]);
			paste_salary(salary, 'Position and Company Match!')
		} else {
			var url_two = 'http://www.indeed.com/salary?q1=' + posit + 
				'&l1=' + format_url(data[i].city.toLowerCase());
			console.log(url_two);
			scrape_h1b(check_indeed_salary, url_two);
		}
	}

	function check_indeed_salary(responseText) {
		var indeed_salary = $(responseText).find("span.salary")[0].textContent
		console.log(indeed_salary);
		if (indeed_salary.length > 1) {
			paste_salary(indeed_salary, 'City Average')
		}
	}

	function paste_salary(salary, exact_value) {
		$("div.editable-item.section-item.current-position").append("<p><h4>[$" + salary + "]</h4> - " + data[0].position + " in " + data[0].city + " - " + exact_value + "</pin>");
	}

	function replace_city(city) {
		result = ''
		cities.forEach(function(cit) {
			if(city.toLowerCase().indexOf(cit.toLowerCase()) > -1) { result = result + cit }
		});
		if(result.length < 1) {
			result = city.split(",")[0].toLowerCase()
		}
		return result
	}
});