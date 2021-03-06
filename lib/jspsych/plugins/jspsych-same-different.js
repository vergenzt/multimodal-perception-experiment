/**
 * jspsych-same-different
 * Josh de Leeuw
 *
 * plugin for showing two stimuli sequentially and getting a same / different judgment
 *
 * documentation: docs.jspsych.org
 *
 */
(function($) {
	jsPsych['same-different'] = (function() {

		var plugin = {};

		plugin.create = function(params) {

			params = jsPsych.pluginAPI.enforceArray(params, ['answer'])

			var trials = new Array(params.stimuli.length);
			for (var i = 0; i < trials.length; i++) {
				trials[i] = {};
				trials[i].stimuli = params.stimuli[i];
				trials[i].answer = params.answer[i];
				trials[i].same_key = params.same_key || 81; // default is 'q'
				trials[i].different_key = params.different_key || 80; // default is 'p'
				// timing parameters
				trials[i].timing_first_stim = params.timing_first_stim || 1000; // if -1, the first stim is shown until any key is pressed
				trials[i].timing_second_stim = params.timing_second_stim || 1000; // if -1, then second stim is shown until response.
				trials[i].timing_gap = params.timing_gap || 500;
				// optional parameters
				trials[i].is_html = (typeof params.is_html === 'undefined') ? false : true;
				trials[i].prompt = (typeof params.prompt === 'undefined') ? "" : params.prompt;
			}
			return trials;
		};

		plugin.trial = function(display_element, trial) {

			// if any trial variables are functions
			// this evaluates the function and replaces
			// it with the output of the function
			trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

			// unpack the stimuli array (for backwards code compatibility. this could be cleaned up in the future)
			trial.a_path = trial.stimuli[0];
			trial.b_path = trial.stimuli[1];

			// this array holds handlers from setTimeout calls
			// that need to be cleared if the trial ends early
			var setTimeoutHandlers = [];

      //show prompt here
      if (trial.prompt !== "") {
        display_element.append(trial.prompt);
      }

			// show image
			if (!trial.is_html) {
				display_element.append($('<img>', {
					src: trial.a_path,
					"class": 'jspsych-same-different-stimulus'
				}));
			} else {
				display_element.append($('<div>', {
					html: trial.a_path,
					"class": 'jspsych-same-different-stimulus'
				}));
			}

			var first_stim_info;
			if (trial.timing_first_stim > 0) {
				setTimeoutHandlers.push(setTimeout(function() {
					showBlankScreen();
				}, trial.timing_first_stim));
			}
			else {
				function afterKeyboardResponse(info) {
					first_stim_info = info;
					showBlankScreen();
				}
				jsPsych.pluginAPI.getKeyboardResponse(afterKeyboardResponse, [], 'date', false);
			}

			function showBlankScreen() {
				$('.jspsych-same-different-stimulus').remove();

				setTimeoutHandlers.push(setTimeout(function() {
					showSecondStim();
				}, trial.timing_gap));
			}

			function showSecondStim() {
				if (!trial.is_html) {
					display_element.append($('<img>', {
						src: trial.b_path,
						"class": 'jspsych-same-different-stimulus',
						id: 'jspsych-same-different-second-stimulus'
					}));
				} else {
					display_element.append($('<div>', {
						html: trial.b_path,
						"class": 'jspsych-same-different-stimulus',
						id: 'jspsych-same-different-second-stimulus'
					}));
				}

				if (trial.timing_second_stim > 0) {
					setTimeoutHandlers.push(setTimeout(function() {
						$("#jspsych-same-different-second-stimulus").css('visibility', 'hidden');
					}, trial.timing_second_stim));
				}

				var after_response = function(info) {

					// kill any remaining setTimeout handlers
					for (var i = 0; i < setTimeoutHandlers.length; i++) {
						clearTimeout(setTimeoutHandlers[i]);
					}

					var correct = false;

					if (info.key == trial.same_key && trial.answer == 'same') {
						correct = true;
					}

					if (info.key == trial.different_key && trial.answer == 'different') {
						correct = true;
					}

					var trial_data = {
						"rt_stim1": first_stim_info.rt,
						"rt": info.rt,
						"answer": trial.answer,
						"correct": correct,
						"stimulus_1": trial.a_path,
						"stimulus_2": trial.b_path,
						"key_press_stim1": first_stim_info.key,
						"key_press": info.key
					};
					jsPsych.data.write(trial_data);

					display_element.html('');

					jsPsych.finishTrial();
				}

				jsPsych.pluginAPI.getKeyboardResponse(after_response, [trial.same_key, trial.different_key], 'date', false);

			}

		};

		return plugin;
	})();
})(jQuery);
