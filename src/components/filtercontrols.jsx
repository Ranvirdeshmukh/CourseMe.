import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  Typography,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  Collapse,
} from '@mui/material';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

const FilterControls = ({ 
  departments, 
  distribs, 
  filters, 
  setFilters 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDepartmentChange = (event) => {
    setFilters(prev => ({
      ...prev,
      department: event.target.value
    }));
  };

  const handleDistribsChange = (event) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      distribs: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleLayupScoreChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      layupScore: newValue
    }));
  };

  const handleApprovalRateChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      approvalRate: newValue
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      department: '',
      distribs: [],
      layupScore: 0,
      approvalRate: 0
    });
  };

  const activeFilterCount = [
    filters.department,
    ...filters.distribs,
    filters.layupScore > 0,
    filters.approvalRate > 0
  ].filter(Boolean).length;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Compact Filter Header */}
      <Box 
        onClick={() => setIsOpen(!isOpen)}
        sx={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: isOpen ? 'primary.main' : 'divider',
          borderRadius: '20px',
          px: 2,
          py: 0.75,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(87, 28, 224, 0.04)',
          },
        }}
      >
        <Filter size={16} />
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            color: isOpen ? 'primary.main' : 'text.primary',
          }}
        >
          Filters
          {activeFilterCount > 0 && (
            <Chip 
              label={activeFilterCount}
              size="small"
              sx={{ 
                ml: 1,
                height: '18px',
                minWidth: '18px',
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiChip-label': {
                  px: 1,
                  fontSize: '0.75rem',
                }
              }}
            />
          )}
        </Typography>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilters();
            }}
            sx={{ 
              ml: 1,
              minWidth: 0,
              textTransform: 'none',
              color: 'primary.main',
              fontSize: '0.75rem',
              p: '2px 8px',
              '&:hover': {
                bgcolor: 'rgba(87, 28, 224, 0.08)'
              }
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* Filter Content */}
      <Collapse in={isOpen}>
        <Box 
          sx={{ 
            mt: 2,
            p: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2.5
          }}
        >
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department}
              onChange={handleDepartmentChange}
              label="Department"
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Distribs</InputLabel>
            <Select
              multiple
              value={filters.distribs}
              onChange={handleDistribsChange}
              input={<OutlinedInput label="Distribs" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {distribs.map((distrib) => (
                <MenuItem key={distrib} value={distrib}>
                  <Checkbox checked={filters.distribs.indexOf(distrib) > -1} />
                  <ListItemText primary={distrib} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum Layup Score
            </Typography>
            <Slider
              value={filters.layupScore}
              onChange={handleLayupScoreChange}
              valueLabelDisplay="auto"
              min={0}
              max={5}
              step={0.5}
            />
          </Box>

          <Box sx={{ width: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum Approval Rate (%)
            </Typography>
            <Slider
              value={filters.approvalRate}
              onChange={handleApprovalRateChange}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              step={5}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterControls;