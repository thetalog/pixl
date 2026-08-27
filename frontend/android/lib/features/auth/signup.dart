import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:pixl/features/auth/login.dart';
import 'dart:convert';
import 'widgets/dobField.dart';
import 'package:pixl/core/config/config.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController nameController = TextEditingController(
    text: "Jessica",
  );
  final TextEditingController emailController = TextEditingController(
    text: "jessica@example.com",
  );
  final TextEditingController passwordController = TextEditingController(
    text: "password123",
  );
  final TextEditingController confirmPasswordController = TextEditingController(
    text: "password123",
  );
  final TextEditingController usernameController = TextEditingController(
    text: "Jessica",
  );
  final TextEditingController dobController = TextEditingController();
  bool isNameValid = false;
  bool isEmailValid = false;
  bool isPasswordValid = false;
  bool isConfirmPasswordValid = false;
  bool isUserNameValid = false;
  bool isDobValid = false;

  bool isNameTyped = false;
  bool isEmailTyped = false;
  bool isPasswordTyped = false;
  bool isConfirmPasswordTyped = false;
  bool isUserNameTyped = false;
  bool isDobTyped = false;

  DateTime? selectedDate;
  bool isLoading = false;
  bool isFormValid = false;
  bool isPasswordHidden = true;
  void checkIfAllFieldsValid() {
    if (isNameValid &&
        isEmailValid &&
        isPasswordValid &&
        isConfirmPasswordValid &&
        isUserNameValid &&
        isDobValid) {
      setState(() {
        isFormValid = true;
      });
    } else {
      setState(() {
        isFormValid = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    nameController.addListener(() {
      if (nameController.text.length > 3 &&
          RegExp(r'^[A-Za-z ]{2,}$').hasMatch(nameController.text)) {
        setState(() {
          isNameValid = true;
        });
      } else {
        setState(() {
          isNameValid = false;
        });
      }
      checkIfAllFieldsValid();
      isNameTyped = true;
    });
    emailController.addListener(() {
      if (emailController.text.length > 5 &&
          RegExp(
            r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
          ).hasMatch(emailController.text)) {
        setState(() {
          isEmailValid = true;
        });
      } else {
        setState(() {
          isEmailValid = false;
        });
      }
      checkIfAllFieldsValid();
      isEmailTyped = true;
    });
    passwordController.addListener(() {
      if (passwordController.text.length > 8 &&
          RegExp(
            r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$',
          ).hasMatch(passwordController.text)) {
        setState(() {
          isPasswordValid = true;
        });
      } else {
        setState(() {
          isPasswordValid = false;
        });
      }
      checkIfAllFieldsValid();
      isPasswordTyped = true;
    });
    confirmPasswordController.addListener(() {
      if (confirmPasswordController.text.length > 8 &&
          RegExp(
            r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$',
          ).hasMatch(passwordController.text)) {
        if (passwordController.text == confirmPasswordController.text) {
          setState(() {
            isConfirmPasswordValid = true;
          });
        } else {
          setState(() {
            isConfirmPasswordValid = false;
          });
        }
      } else {
        setState(() {
          isConfirmPasswordValid = false;
        });
      }
      checkIfAllFieldsValid();
      isConfirmPasswordTyped = true;
    });
    usernameController.addListener(() {
      if (usernameController.text.length > 5 &&
          RegExp(
            r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d._]{8,}$',
          ).hasMatch(usernameController.text)) {
        setState(() {
          isUserNameValid = true;
        });
      } else {
        setState(() {
          isUserNameValid = false;
        });
      }
      checkIfAllFieldsValid();
      isUserNameTyped = true;
    });
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    usernameController.dispose();
    dobController.dispose();
    super.dispose();
  }

  void onSubmit() async {
    final String name = nameController.text.trim();
    final String email = emailController.text.trim();
    final String password = passwordController.text;
    final String confirmPassword = confirmPasswordController.text;
    final String username = usernameController.text.trim();

    if (name.isEmpty ||
        email.isEmpty ||
        password.isEmpty ||
        username.isEmpty ||
        selectedDate == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Please fill all fields")));
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Passwords do not match!")));
      return;
    }

    setState(() => isLoading = true);

    try {
      final response = await http.post(
        Uri.parse(Config.buildApiUrl('/auth/signup')),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'userName': username,
          'dateOfBirth': selectedDate!.toUtc().toIso8601String(),
        }),
      );

      setState(() => isLoading = false);

      print("Response Status: ${response.statusCode}");
      print("Response Body: ${response.body}");

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Signup successful!")));
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      } else {
        try {
          final error = jsonDecode(response.body);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error['message'] ?? 'Signup failed')),
          );
        } catch (e) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error: ${response.body}')));
        }
      }
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  bool is18OrAbove(String dobText) {
    if (dobText.isEmpty) return false;

    final parts = dobText.split('-'); // expecting yyyy-mm-dd
    if (parts.length != 3) return false;

    final birthDate = DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );

    final today = DateTime.now();

    int age = today.year - birthDate.year;

    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }
    if (age >= 18) {
      isDobValid = true;
    } else {
      isDobValid = false;
    }
    checkIfAllFieldsValid();
    return age >= 18;
  }

  void onDateSelected(DateTime date) {
    setState(() {
      selectedDate = date;
      dobController.text = selectedDate!.toLocal().toString().split(' ')[0];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: const Text(
                  'Signup',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Lunasima-Bold',
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: 'Name',
                      hint: Text("Enter your name"),
                      prefixIcon: const Icon(Icons.person),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    isNameTyped
                        ? isNameValid
                              ? "Field is Valid✅"
                              : "Field is Not Valid❌"
                        : "",
                    style: TextStyle(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: emailController,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      hint: Text("Enter your email"),
                      prefixIcon: const Icon(Icons.email),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    isEmailTyped
                        ? isEmailValid
                              ? "Field is Valid✅"
                              : "Field is Not Valid❌"
                        : "",
                    style: TextStyle(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: passwordController,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hint: Text("Enter your password"),
                      prefixIcon: const Icon(Icons.password),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      suffixIcon: GestureDetector(
                        child: isPasswordHidden
                            ? Icon(Icons.remove_red_eye_outlined)
                            : Icon(Icons.remove_red_eye_sharp),
                        onTap: () => {
                          setState(() {
                            isPasswordHidden = !isPasswordHidden;
                          }),
                        },
                      ),
                    ),
                    obscureText: isPasswordHidden,
                  ),
                  SizedBox(height: 4),
                  Text(
                    isPasswordTyped
                        ? isPasswordValid
                              ? "Field is Valid✅"
                              : "Field is Not Valid❌"
                        : "",
                    style: TextStyle(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: confirmPasswordController,
                    decoration: InputDecoration(
                      labelText: 'Confirm Password',
                      hint: Text("Enter your password"),
                      prefixIcon: const Icon(Icons.password),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    obscureText: true,
                  ),
                  SizedBox(height: 4),
                  Text(
                    isConfirmPasswordTyped
                        ? isConfirmPasswordValid
                              ? "Field is Valid✅"
                              : "Field is Not Valid❌"
                        : "",
                    style: TextStyle(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: usernameController,
                    decoration: InputDecoration(
                      labelText: 'Username',
                      hint: Text("Enter your username"),
                      prefixIcon: const Icon(Icons.label),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    isUserNameTyped
                        ? isUserNameValid
                              ? "Field is Valid✅"
                              : "Field is Not Valid❌"
                        : "",
                    style: TextStyle(color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        flex: 9,
                        child: TextField(
                          controller: dobController,
                          decoration: InputDecoration(
                            labelText: 'Date Of Birth',
                            hint: Text("Enter your Date Of Birth"),
                            prefixIcon: const Icon(Icons.bedroom_baby),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          enabled: false,
                        ),
                      ),
                      const SizedBox(width: 8),
                      DobField(onDateSelected: onDateSelected),
                    ],
                  ),
                  SizedBox(height: 10),
                  Text(
                    is18OrAbove(dobController.text)
                        ? "Age verified ✅"
                        : "You must be at least 18",
                    style: TextStyle(
                      fontSize: 16,
                      color: is18OrAbove(dobController.text)
                          ? Colors.green
                          : Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    flex: 6,
                    child: isFormValid
                        ? ElevatedButton(
                            onPressed: isLoading ? null : onSubmit,
                            child: isLoading
                                ? const CircularProgressIndicator()
                                : Text(
                                    "Submit",
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                            style: ButtonStyle(
                              backgroundColor: WidgetStateProperty.all(
                                const Color(0xFF3E62FF),
                              ),
                              shape: WidgetStateProperty.all(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          )
                        : ElevatedButton(
                            onPressed: null,
                            child: isLoading
                                ? const CircularProgressIndicator()
                                : Text(
                                    "Submit",
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                            style: ButtonStyle(
                              backgroundColor: WidgetStateProperty.all(
                                isFormValid
                                    ? const Color(0xFF3E62FF)
                                    : const Color.fromARGB(255, 135, 157, 255),
                              ),
                              shape: WidgetStateProperty.all(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                  ),
                  SizedBox(width: 40),
                  Expanded(
                    flex: 4,
                    child: GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                      ),
                      child: const Text(
                        'Go to Login',
                        style: TextStyle(
                          fontSize: 16,
                          color: const Color(0xFF3E62FF),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
