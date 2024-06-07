import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, CardMedia, Typography, Grid, Button, TextField, IconButton, Modal, Autocomplete, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EditIcon from '@mui/icons-material/Edit'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import '../styles/MyRecipes.css';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { storage } from "./../../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 } from 'uuid';

const MyRecipes = () => {
  const [showYourRecipes, setShowYourRecipes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingNewRecipe, setAddingNewRecipe] = useState(false); 
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [mealType, setMealType] = useState('');
  const [image, setImage] = useState(null); 
  const [imagePreview, setImagePreview] = useState(''); 
  const [uid, setUid] = useState('');
  const [yourRecipes, setYourRecipes] = useState([]);
  const [favoritedRecipes, setFavoritedRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const cuisineTypes = [
    'American', 'Asian', 'British', 'Caribbean', 'Central European', 'Chinese',
    'Eastern European', 'French', 'Greek', 'Indian', 'Italian', 'Japanese',
    'Korean', 'Kosher', 'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic',
    'South American', 'South East Asian', 'World'
  ];

  const mealTypes = ['Breakfast', 'Brunch', 'Lunch/Dinner', 'Snack', 'Teatime'];

  const getRecipes = () => {
    const recipes = showYourRecipes ? yourRecipes : favoritedRecipes;
    return recipes.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  async function fetchFavoritedRecipes(uid) {
    try {
      const result = await axios.get(`http://localhost:5001/myRecipes/favorites/${uid}`);
      setFavoritedRecipes(result.data);
      console.log("result", result.data); 
    } catch (error) {
      console.error('Error fetching favorited recipes:', error);
    }
  }

  const handleUnfavorite = async (recipeId) => {
    try {
      await axios.post('http://localhost:5001/myRecipes/unfavorite', { uid, recipeId });
      setFavoritedRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
      alert(`Unfavorited recipe with ID: ${recipeId}`);
    } catch (error) {
      console.error('Error unfavoriting recipe:', error);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    console.log(editingRecipe);
  };

  const handleSave = async (rid) => {
    editingRecipe['img'] = await getImg();
    console.log(editingRecipe);
    const r = await axios.put(`http://localhost:5001/myRecipes/edit/${rid}`, editingRecipe);
    console.log(r);
    await fetchCreatedRecipes(uid);
    setEditingRecipe(null);
  };

  const toggleAddNewRecipe = () => {
    setAddingNewRecipe(!addingNewRecipe);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  async function getImg() {
    const imgRef = ref(storage, `recipeImages/${v4()}`);
    const imgSnapshot = await uploadBytes(imgRef, image);
    return await getDownloadURL(imgSnapshot.ref);
  }

  async function handleSubmit() {
    console.log('Submitted', uid);
    console.log('Image:', image); 
    const downloadUrl = await getImg();

    const data = {
      'name': title, 
      'desc': desc, 
      'cuisineType': cuisineType, 
      'mealType': mealType, 
      'uid': uid,
      'img': downloadUrl
    }
    console.log(data);
    const result = await axios.post(`http://localhost:5001/myRecipes/draft`, data);
    console.log(result);
    alert("Recipe added!")
    await fetchCreatedRecipes(uid);
    toggleAddNewRecipe();
  }

  async function fetchCreatedRecipes(uid) {
    console.log(uid);
    const result = (await axios.get(`http://localhost:5001/myRecipes/created/${uid}`)).data;
    setYourRecipes(result);
    console.log(result);
  }

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchCreatedRecipes(user.uid);
        fetchFavoritedRecipes(user.uid); 
      } else {
        alert('Not logged in');
      }
    });
  }, [])

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        {showYourRecipes ? 'Recipes you Created:' : 'Recipes you Favorited:'}
      </Typography>

      <Card sx={{ width: '100%', mb: 4 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            sx={{ mr: 2, flex: '1' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', flex: '1', justifyContent: 'flex-end' }}>
            <Button
              variant={showYourRecipes ? 'contained' : 'outlined'}
              onClick={() => setShowYourRecipes(true)}
              sx={{
                mr: 1,
                bgcolor: showYourRecipes ? '#2e6123' : 'transparent',
                color: showYourRecipes ? 'white' : '#2e6123',
                '&:hover': {
                  bgcolor: showYourRecipes ? '#1e4a1c' : '#2e6123',
                  color: 'white',
                },
              }}
            >
              Your Recipes
            </Button>
            <Button
              variant={!showYourRecipes ? 'contained' : 'outlined'}
              onClick={() => setShowYourRecipes(false)}
              sx={{
                bgcolor: !showYourRecipes ? '#2e6123' : 'transparent',
                color: !showYourRecipes ? 'white' : '#2e6123',
                '&:hover': {
                  bgcolor: !showYourRecipes ? '#1e4a1c' : '#2e6123',
                  color: 'white',
                },
              }}
            >
              Favorited Recipes
            </Button>
          </Box>
        </CardContent>
      </Card>

      {showYourRecipes && (
        <Button
          onClick={toggleAddNewRecipe}
          sx={{
            mb: 2,
            bgcolor: addingNewRecipe ? '#ff0000' : '#2e6123',
            color: 'white',
            '&:hover': {
              bgcolor: addingNewRecipe ? '#cc0000' : '#1e4a1c',
            },
          }}
        >
          {addingNewRecipe ? 'Cancel' : 'Want to add a recipe?'}
        </Button>
      )}

      {addingNewRecipe && (
        <Card sx={{ mb: 4, p: 2 }}>
          <Typography variant="h5">Add New Recipe</Typography>
          <TextField fullWidth label="Title" sx={{ mb: 2 }} onChange={(text) => setTitle(text.target.value)} />
          <TextField fullWidth label="Description" multiline rows={4} sx={{ mb: 2 }} onChange={(text) => setDesc(text.target.value)} />
          <Autocomplete
            options={cuisineTypes}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} label="Cuisine Type" sx={{ mb: 2 }} />}
            onChange={(event, value) => setCuisineType(value)}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Meal Type</InputLabel>
            <Select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              label="Meal Type"
            >
              {mealTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            component="label"
            sx={{ mb: 2 }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && <CheckCircleIcon sx={{ ml: 1, color: 'green' }} />}
          </Button>
          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <img src={imagePreview} alt="Recipe" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </Box>
          )}
          <Button variant="contained" color="primary" style = {{display: 'block'}} onClick={handleSubmit}>Submit</Button>
        </Card>
      )}

      <Grid container spacing={2}>
        {yourRecipes && getRecipes().map(recipe => (
          <Grid key={recipe.id} item xs={12} sm={6} md={3}>
            <a 
              href={`./recipeView/${recipe.id}`} 
              onClick={(e) => {
                if (e.defaultPrevented) return; 
                handleOpenRecipe(recipe.id);
              }}
              style={{textDecoration:'none'}}
            >
              <Card className="recipe-card">
                <Box sx={{ position: 'relative' }}>
                  {showYourRecipes && (
                    <IconButton
                      aria-label="edit"
                      onClick={(e) => {
                        e.preventDefault(); // Prevents the default anchor tag action
                        e.stopPropagation(); // Stops the propagation to parent elements
                        handleEdit(recipe);
                      }}
                      sx={{ position: 'absolute', top: '0', right: '0', zIndex: 1000 }}
                    >
                      <EditIcon style={{ zIndex: 200, color: 'white', background: '#0000006b' }} />
                    </IconButton>
                  )}
                  {!showYourRecipes && (
                    <IconButton
                      aria-label="unfavorite"
                      onClick={(e) => {
                        e.preventDefault(); // Prevents the default anchor tag action
                        e.stopPropagation(); // Stops the propagation to parent elements
                        handleUnfavorite(recipe.id);
                      }}
                      sx={{ position: 'absolute', top: '0', right: '0', zIndex: 1 }}
                      style={{ color: '#ff0000', background: '#0000006b' }}
                    >
                      <FavoriteIcon />
                    </IconButton>
                  )}
                  <CardMedia
                    component="img"
                    sx={{ height: 140, borderBottom: '7px solid #2e6123', minHeight: '18vh', maxHeight: '18vh' }}
                    image={recipe.img}
                    alt={recipe.name}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6">{recipe.title}</Typography>
                  {recipe.author && (
                    <Typography variant="subtitle2" color="text.secondary">Author: {recipe.author}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {recipe.desc.length > 40 ? `${recipe.desc.substring(0, 40)}...` : recipe.desc}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Cuisine: {recipe.cuisineType}</Typography>
                  <Typography variant="body2" color="text.secondary">Meal Type: {recipe.mealType}</Typography>
                </CardContent>
              </Card>
            </a>
          </Grid>
        ))}
      </Grid>

      {editingRecipe && (
        <Modal
          open={Boolean(editingRecipe)}
          onClose={() => setEditingRecipe(null)}
          aria-labelledby="edit-recipe-modal"
          aria-describedby="edit-recipe-modal-description"
        >
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: 400, 
            height: 600,
            bgcolor: 'background.paper', 
            boxShadow: 24, 
            p: 4 ,
            overflowY: 'scroll'
          }}>
            <Typography variant="h6" id="edit-recipe-modal">Edit Recipe</Typography>
            <TextField
              fullWidth
              label="Title"
              sx={{ mb: 2 }}
              value={editingRecipe.name}
              onChange={(e) => setEditingRecipe({ ...editingRecipe, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              sx={{ mb: 2 }}
              value={editingRecipe.desc}
              onChange={(e) => setEditingRecipe({ ...editingRecipe, desc: e.target.value })}
            />
            <TextField
              fullWidth
              label="Steps"
              multiline
              rows={6}
              sx={{ mb: 2 }}
              value={editingRecipe.steps}
              onChange={(e) => setEditingRecipe({ ...editingRecipe, steps: e.target.value })}
            />
            <Autocomplete
              options={cuisineTypes}
              getOptionLabel={(option) => option}
              renderInput={(params) => <TextField {...params} label="Cuisine Type" sx={{ mb: 2 }} />}
              value={editingRecipe.cuisineType}
              onChange={(event, value) => setEditingRecipe({ ...editingRecipe, cuisineType: value })}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Meal Type</InputLabel>
              <Select
                value={editingRecipe.mealType}
                onChange={(e) => setEditingRecipe({ ...editingRecipe, mealType: e.target.value })}
                label="Meal Type"
              >
                {mealTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
            variant="contained"
            component="label"
            sx={{ mb: 2 }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
            {image && <CheckCircleIcon sx={{ ml: 1, color: 'green' }} />}
          </Button>
          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <img src={imagePreview} alt="Recipe" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            </Box>
          )}
          <br></br>
            <Button variant="contained" color="primary" onClick={() => handleSave(editingRecipe.id)}>Save</Button>
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default MyRecipes;
